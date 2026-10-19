import config from './config.json' with { type: 'json' }
import { createUploadHandler } from './handler.ts'

Deno.serve(createUploadHandler({
  env: name => Deno.env.get(name),
  fetch: globalThis.fetch,
  acceptedTokenHashes: config.acceptedTokenHashes,
}))
