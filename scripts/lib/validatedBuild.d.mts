export interface BuildSource { sourceCommit: string; tree: string; kind?: 'audio' }
export interface ValidatedBuildProof extends BuildSource {
  version: 1
  repository: string
  runId: number
  runAttempt: number
  commit: string
  files: Record<string, { bytes: number; sha256: string }>
}
export function validatedBuildArtifact(attempt: number): string
export function captureBuildSource(root: string, date: string): BuildSource
export function captureAudioBuildSource(root: string): BuildSource
export function verifyTrustedBuildRun(options: { run: unknown; jobs: unknown; repository: string }): 'daily' | 'audio'
export function verifyBuildProvenance(options: {
  proof: unknown; run: unknown; jobs: unknown; repository: string; commit: string; tree: string; parents: string[]
}): void
export function sealValidatedBuild(options: {
  root: string; capture: BuildSource; output: string; repository: string; runId: number; runAttempt: number
}): Promise<ValidatedBuildProof>
export function verifyValidatedBuild(options: {
  root: string; directory: string; run: unknown; jobs: unknown; repository: string; expectedCommit: string
}): Promise<ValidatedBuildProof>
