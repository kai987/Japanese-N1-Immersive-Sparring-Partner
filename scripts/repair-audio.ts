import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { audioWorker, type AudioRepair } from './audio-worker.ts'

// Foreground repair is deliberately separate from audio:auto and the installed bootstrap.
// It retains the same OS lock, immutable uploads, validation and normal-push transaction.
export function repairOptions(args: string[], inherited?: string): AudioRepair {
  const inheritedLock = args.includes('--lock-fd')
  if (inheritedLock) {
    if (!inherited) throw new Error('Missing inherited repair configuration')
    const value = JSON.parse(inherited) as AudioRepair
    if (!Array.isArray(value.dates) || value.dates.length === 0 || new Set(value.dates).size !== value.dates.length || value.dates.some(date => typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      || !Number.isSafeInteger(value.deadline) || value.deadline <= Date.now() || value.deadline > Date.now() + 2 * 60 * 60_000
      || typeof value.evidenceDirectory !== 'string' || resolve(value.evidenceDirectory) !== value.evidenceDirectory
      || value.entrypoint !== fileURLToPath(import.meta.url)) throw new Error('Invalid inherited repair configuration')
    return value
  }
  const allowed = new Set(['--dates', '--evidence-dir', '--state-dir'])
  for (let index = 0; index < args.length; index += 2) {
    if (!allowed.has(args[index]) || !args[index + 1] || args[index + 1].startsWith('--')) throw new Error('Use --dates DATE,DATE --evidence-dir PATH [--state-dir PATH]')
  }
  const dates = args[args.indexOf('--dates') + 1]?.split(',')
  const evidence = args[args.indexOf('--evidence-dir') + 1]
  if (!args.includes('--dates') || !dates?.length || new Set(dates).size !== dates.length || dates.some(date => !/^\d{4}-\d{2}-\d{2}$/.test(date))
    || !args.includes('--evidence-dir') || !evidence) throw new Error('Explicit dates and a persistent evidence directory are required')
  return { dates, evidenceDirectory: resolve(evidence), entrypoint: fileURLToPath(import.meta.url), deadline: Date.now() + 2 * 60 * 60_000 }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repair = repairOptions(process.argv.slice(2), process.env.N1_AUDIO_REPAIR_CONFIG)
  delete process.env.N1_AUDIO_REPAIR_CONFIG
  await audioWorker(repair)
}
