import type { Plugin } from 'vite'
import { join } from 'node:path'
import { createBrowserAudio, createBrowserLessons, browserDataRoot } from './lib/browserData.ts'
import { createLessonSearchIndex } from '../src/lib/projectSearch.ts'

const prefix = 'virtual:n1-'
const dataRoute = '/__n1_data/'
const script = (value: unknown) => `export default ${JSON.stringify(value)};`

export function browserDataPlugin(): Plugin {
  let data: ReturnType<typeof createBrowserLessons> | undefined
  let searchIndex: ReturnType<typeof createLessonSearchIndex> | undefined
  let building = false
  let base = '/'
  let assets: { lessons: Record<string, string>; searchIndex: string } | undefined
  const current = () => data ??= createBrowserLessons()
  const currentIndex = () => searchIndex ??= createLessonSearchIndex(current().lessons, current().reviewFocusByDate)
  const archivedDates = () => current().catalog.historyItems.filter(item => item.date !== current().catalog.latest.lesson.date)
  return {
    name: 'verified-browser-data',
    configResolved(config) { building = config.command === 'build'; base = config.base },
    buildStart() {
      data = undefined
      searchIndex = undefined
      current()
      if (building) {
        // Data uses fetch instead of native JS imports: a failed request must be
        // retryable without reloading the app or losing the current search.
        const emit = (name: string, value: unknown) => this.emitFile({ type: 'asset', name, source: JSON.stringify(value) })
        assets = {
          lessons: Object.fromEntries(archivedDates().map(({ date }) => [date, emit(`n1-lesson-${date}.json`, current().byDate[date])])),
          searchIndex: emit('n1-search-index.json', currentIndex()),
        }
      }
      // Development reloads use the same complete validation as release builds.
      this.addWatchFile(join(browserDataRoot, 'src/data'))
      this.addWatchFile(join(browserDataRoot, 'public/audio/manifest.json'))
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
        // Vite may already have removed a configured development base.
        const route = pathname.startsWith(base + dataRoute.slice(1)) ? pathname.slice(base.length - 1) : pathname
        if (!route.startsWith(dataRoute)) return next()
        if (request.method !== 'GET' && request.method !== 'HEAD') { response.statusCode = 405; response.end(); return }
        try {
          const name = route.slice(dataRoute.length)
          const match = /^lesson\/(\d{4}-\d{2}-\d{2})\.json$/.exec(name)
          const value = name === 'search-index.json' ? currentIndex() : match ? current().byDate[match[1]] : undefined
          if (!value) { response.statusCode = 404; response.end('Unknown verified learning data'); return }
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.setHeader('Cache-Control', 'no-cache')
          response.end(request.method === 'HEAD' ? undefined : JSON.stringify(value))
        } catch (error) { next(error) }
      })
    },
    resolveId(id) { if (id.startsWith(prefix)) return `\0${id}` },
    load(id) {
      if (!id.startsWith(`\0${prefix}`)) return
      const name = id.slice(1)
      if (name === `${prefix}catalog`) return script(current().catalog)
      if (name === `${prefix}audio-client`) return script(createBrowserAudio())
      if (name === `${prefix}data-assets`) {
        if (!building) return script({ lessons: Object.fromEntries(archivedDates().map(({ date }) => [date, `${base}${dataRoute.slice(1)}lesson/${date}.json`])), searchIndex: `${base}${dataRoute.slice(1)}search-index.json` })
        if (!assets) throw new Error('Verified learning data assets have not been generated')
        const fileUrl = (reference: string) => `import.meta.ROLLUP_FILE_URL_${reference}`
        return `export default {lessons:{${Object.entries(assets.lessons).map(([date, reference]) => `${JSON.stringify(date)}:${fileUrl(reference)}`).join(',')}},searchIndex:${fileUrl(assets.searchIndex)}};`
      }
      throw new Error(`Unknown browser data module: ${name}`)
    },
    handleHotUpdate(context) {
      if (!context.file.startsWith(join(browserDataRoot, 'src/data')) && !context.file.startsWith(join(browserDataRoot, 'public/audio'))) return
      data = undefined
      searchIndex = undefined
      for (const module of context.server.moduleGraph.idToModuleMap.values()) {
        if (module.id?.startsWith(`\0${prefix}`)) context.server.moduleGraph.invalidateModule(module)
      }
      context.server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}
