export const releaseManifestName: 'n1-release.json'
export const releaseArtifactName: 'n1-deployment-verification'
export interface ReleaseManifest {
  version: 1
  latestDate: string
  studySnapshotCommit: string
  entryPoints: string[]
  lessons: Record<string, { path: string; day: number; title: string }>
  searchIndex: string
  files: Record<string, { sha256: string; bytes: number }>
}
export function createReleaseManifest(options: {
  files: { path: string; content: string | Uint8Array }[]
  lessons: ReleaseManifest['lessons']
  latestDate: string
  searchIndex: string
  studySnapshotCommit: string
  entryPoints: string[]
}): ReleaseManifest
export function verifyPublishedRelease(options: {
  baseUrl: string
  expectedManifest: string | Uint8Array
  target?: { date: string; day?: number; title?: string; sourceCommit?: string }
  fetchImpl?: typeof fetch
  signal?: AbortSignal
  timeoutMs?: number
  requestTimeoutMs?: number
  concurrency?: number
}): Promise<{ manifestSha256: string; verifiedFiles: number; latestDate: string; targetDate: string | null }>
