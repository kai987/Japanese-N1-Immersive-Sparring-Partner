import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { verifyPublishedRelease } from './lib/deploymentVerification.mjs'
import { validateRequest } from './n1-automation.mjs'

export async function verifyDeploymentCommand(args) {
  const option = name => { const at = args.indexOf(name); return at < 0 ? undefined : args[at + 1] }
  const baseUrl = option('--url'), manifest = option('--manifest'), requestPath = option('--request')
  if (!baseUrl || !manifest || !requestPath) throw new Error('Usage: verify-deployment.mjs --url URL --manifest FILE --request REQUEST.json')
  const request = validateRequest(JSON.parse(readFileSync(requestPath, 'utf8')))
  if (typeof request.daily.lesson.title !== 'string' || !request.daily.lesson.title.trim()) throw new Error('Requested lesson title is required')
  const result = await verifyPublishedRelease({ baseUrl, expectedManifest: readFileSync(manifest), target: {
    date: request.targetDate, day: request.daily.lesson.day, title: request.daily.lesson.title, sourceCommit: request.sourceCommit,
  } })
  console.log(JSON.stringify({ status: 'published_release_verified', ...result }))
  return result
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await verifyDeploymentCommand(process.argv.slice(2))
