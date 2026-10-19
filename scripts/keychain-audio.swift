// Compile this helper to one stable path before creating the Keychain item.
// macOS's default generic-password access trusts the creating compiled binary.
import Foundation
import Security
import CryptoKit

private let service = "dev.kai987.n1-audio-upload.flpmblfscgcbrprwwckz"
private let account = "n1-audio-worker"
private let label = "N1 Audio Upload (n1-audio only)"

private struct HelperError: Error {
    let message: String
}

private func keychainError(_ operation: String, _ status: OSStatus) -> HelperError {
    // Never include returned Keychain data or user-supplied arguments in errors.
    HelperError(message: "Keychain \(operation) failed (OSStatus \(status)).")
}

private func query() -> [String: Any] {
    [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: service,
        kSecAttrAccount as String: account,
    ]
}

private func validateSecret(_ data: Data) throws -> Data {
    let hexadecimal: Set<UInt8> = Set(Array("0123456789abcdefABCDEF".utf8))
    guard data.count == 64, data.allSatisfy({ hexadecimal.contains($0) }) else {
        // Preserve malformed existing items for explicit user-directed recovery.
        throw HelperError(message: "The N1 audio Keychain item has an invalid token format; it was not changed.")
    }
    return data
}

private func readSecret() throws -> Data? {
    var attributes = query()
    attributes[kSecMatchLimit as String] = kSecMatchLimitOne
    attributes[kSecReturnData as String] = true
    var result: CFTypeRef?
    let status = SecItemCopyMatching(attributes as CFDictionary, &result)
    if status == errSecItemNotFound {
        return nil
    }
    guard status == errSecSuccess else {
        throw keychainError("lookup", status)
    }
    guard let data = result as? Data else {
        throw HelperError(message: "The N1 audio Keychain item returned an unsupported data format.")
    }
    return try validateSecret(data)
}

private func tokenHash(_ data: Data) -> String {
    // Hash the exact 64 ASCII token bytes, not the decoded 32 random bytes.
    SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
}

private func emitJSON(_ object: [String: Any]) throws {
    let data = try JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])
    FileHandle.standardOutput.write(data)
    FileHandle.standardOutput.write(Data([0x0a]))
}

private func initializeSecret() throws {
    if let existing = try readSecret() {
        try emitJSON(["sha256": tokenHash(existing), "created": false])
        return
    }
    var bytes = [UInt8](repeating: 0, count: 32)
    let randomStatus = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
    guard randomStatus == errSecSuccess else {
        throw keychainError("random generation", randomStatus)
    }
    let token = Data(bytes.map { String(format: "%02x", $0) }.joined().utf8)
    var attributes = query()
    attributes[kSecAttrLabel as String] = label
    attributes[kSecAttrDescription as String] = "Upload token for the N1 n1-audio storage worker."
    attributes[kSecValueData as String] = token
    // No custom ACL, synchronizable/data-protection flags, or iOS entitlements:
    // use the default macOS login Keychain and its creating-binary access.
    let status = SecItemAdd(attributes as CFDictionary, nil)
    if status == errSecDuplicateItem {
        // Another invocation may have created the same fixed item concurrently.
        // Reuse its token; never update, rotate, or delete an existing item.
        guard let existing = try readSecret() else {
            throw keychainError("concurrent initialization", errSecItemNotFound)
        }
        try emitJSON(["sha256": tokenHash(existing), "created": false])
        return
    }
    guard status == errSecSuccess else {
        throw keychainError("creation", status)
    }
    try emitJSON(["sha256": tokenHash(token), "created": true])
}

do {
    guard CommandLine.arguments.count == 2 else {
        throw HelperError(message: "Usage: keychain-audio init|status|get")
    }
    switch CommandLine.arguments[1] {
    case "init":
        try initializeSecret()
    case "status":
        if let token = try readSecret() {
            try emitJSON(["found": true, "sha256": tokenHash(token)])
        } else {
            try emitJSON(["found": false, "sha256": NSNull()])
        }
    case "get":
        guard let token = try readSecret() else {
            throw keychainError("lookup", errSecItemNotFound)
        }
        // The parent captures this pipe directly. Never invoke get for display.
        FileHandle.standardOutput.write(token)
    default:
        throw HelperError(message: "Usage: keychain-audio init|status|get")
    }
} catch let error as HelperError {
    FileHandle.standardError.write(Data((error.message + "\n").utf8))
    exit(1)
} catch {
    FileHandle.standardError.write(Data("The N1 audio Keychain helper could not complete the operation.\n".utf8))
    exit(1)
}
