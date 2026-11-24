import type { verifyPublishedRelease } from './lib/deploymentVerification.mjs'
export type Change = { status: string; path: string }
export function parseChangedPaths(raw: string): Change[]
export function classifyReleaseChanges(changes: Change[], checks: {
  requestDate: string; referenced: (path: string) => boolean; lessonExists: (date: string) => boolean
}): { eligible: boolean; reason: string; dates: string[] }
export function isVerifiedActualPagesRun(run: unknown, jobs: unknown[], repository: string): boolean
export function verifyUnchangedRelease(options: {
  root: string; repository: string; expectedCommit: string; runId: string; baseUrl: string
  api: (path: string) => unknown | Promise<unknown>
  download: (run: string, name: string, directory: string) => unknown | Promise<unknown>
  verify?: typeof verifyPublishedRelease
}): Promise<{ unchanged: false; reason: string } | { unchanged: true; baselineRun: number; baselineCommit: string; originalDates: string[] }>
