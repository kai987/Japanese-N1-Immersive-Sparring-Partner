import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir, userInfo } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AUDIO_CHECK_TIMES, AUDIO_TIME_ZONE } from './audio-worker-schedule.ts'

if (process.platform !== 'darwin') throw new Error('This installer requires macOS with the local AivisSpeech engine')
if (Intl.DateTimeFormat().resolvedOptions().timeZone !== AUDIO_TIME_ZONE) throw new Error('Set the Mac system time zone to Asia/Tokyo before installing this calendar schedule')
const root = join(homedir(), 'Library/Application Support/N1 Audio')
const source = fileURLToPath(new URL('../', import.meta.url))
for (const path of [root, join(root, 'bin'), join(root, 'logs')]) mkdirSync(path, { recursive: true, mode: 0o700 })
const marker = join(root, 'installation.json')
if (existsSync(marker) && JSON.parse(readFileSync(marker, 'utf8')).application !== 'kai987/n1-audio-worker') throw new Error('Existing service directory belongs to another application')
const helper = join(root, 'bin/n1-audio-keychain')
// Keep the installed helper's Keychain identity stable across worker updates.
if (!existsSync(helper)) execFileSync('/usr/bin/swiftc', ['-O', join(source, 'scripts/keychain-audio.swift'), '-o', helper], { stdio: 'inherit' })
const credential = JSON.parse(execFileSync(helper, ['init'], { encoding: 'utf8' }))
const configuration = JSON.parse(readFileSync(join(source, 'supabase/functions/n1-audio-upload/config.json'), 'utf8'))
if (!configuration.acceptedTokenHashes.includes(credential.sha256)) throw new Error('Deploy the upload function with this Keychain credential hash before installing the worker')
const bootstrap = join(root, 'bootstrap.mjs')
writeFileSync(bootstrap, readFileSync(join(source, 'scripts/audio-worker-bootstrap.mjs')), { mode: 0o600 })
writeFileSync(join(root, 'audio-worker-schedule.ts'), readFileSync(join(source, 'scripts/audio-worker-schedule.ts')), { mode: 0o600 })
const label = 'dev.kai987.n1-audio-worker'
const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const python = execFileSync('python3', ['-c', 'import sys; print(sys.executable)'], { encoding: 'utf8' }).trim()
const path = `${dirname(process.execPath)}:${dirname(python)}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`
const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array><string>${escape(process.execPath)}</string><string>${escape(bootstrap)}</string></array>
<key>WorkingDirectory</key><string>${escape(root)}</string>
<key>EnvironmentVariables</key><dict><key>PATH</key><string>${escape(path)}</string></dict>
<key>StartCalendarInterval</key><array>${AUDIO_CHECK_TIMES.map(time => `<dict><key>Hour</key><integer>${time.hour}</integer><key>Minute</key><integer>${time.minute}</integer></dict>`).join('')}</array>
<key>RunAtLoad</key><true/>
<key>ExitTimeOut</key><integer>30</integer>
<key>ProcessType</key><string>Background</string>
<key>Nice</key><integer>10</integer>
<key>LowPriorityIO</key><true/>
<key>StandardOutPath</key><string>${escape(join(root, 'logs/worker.log'))}</string>
<key>StandardErrorPath</key><string>${escape(join(root, 'logs/worker-error.log'))}</string>
</dict></plist>\n`
const agentPath = join(homedir(), 'Library/LaunchAgents', `${label}.plist`)
mkdirSync(dirname(agentPath), { recursive: true })
writeFileSync(agentPath, plist, { mode: 0o600 })
execFileSync('/usr/bin/plutil', ['-lint', agentPath], { stdio: 'inherit' })
const domain = `gui/${userInfo().uid}`
try { execFileSync('/bin/launchctl', ['print', `${domain}/${label}`], { stdio: 'ignore' }); execFileSync('/bin/launchctl', ['bootout', `${domain}/${label}`], { stdio: 'ignore' }) } catch { /* First installation. */ }
atomicInstallation()
execFileSync('/bin/launchctl', ['bootstrap', domain, agentPath], { stdio: 'inherit' })
function atomicInstallation() {
  writeFileSync(marker, JSON.stringify({ application: 'kai987/n1-audio-worker', installedAt: new Date().toISOString(),
    node: process.execPath, timeZone: AUDIO_TIME_ZONE, checkTimes: AUDIO_CHECK_TIMES, stopAfterDetection: true, credentialSha256: credential.sha256,
    helperSourceSha256: createHash('sha256').update(readFileSync(join(source, 'scripts/keychain-audio.swift'))).digest('hex') }, null, 2) + '\n', { mode: 0o600 })
}
console.log(JSON.stringify({ installed: true, label, timeZone: AUDIO_TIME_ZONE, window: '11:10–13:10', intervalMinutes: 15, stopAfterDetection: true, progress: join(root, 'progress.json'), browserRequired: false }))
