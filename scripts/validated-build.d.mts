export type RestoreResult = { reused: false; reason: string } | { reused: true; browserValidated: boolean; runId: number; runAttempt: number; commit: string; files: number }
export function restoreValidatedBuild(options: {
  root: string; runId?: string; repository: string; expectedCommit: string
  api: (path: string) => unknown | Promise<unknown>
  download: (runId: string, name: string, directory: string) => unknown | Promise<unknown>
  now?: () => number
  wait?: (ms: number) => Promise<void>
}): Promise<RestoreResult>
export function validatedBuildCommand(args: string[], env?: Record<string, string | undefined>): Promise<RestoreResult | undefined>
