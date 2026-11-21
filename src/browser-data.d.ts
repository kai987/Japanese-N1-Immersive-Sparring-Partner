declare module 'virtual:n1-catalog' {
  const catalog: import('./lib/lessonDataTypes.ts').BrowserCatalog
  export default catalog
}
declare module 'virtual:n1-data-assets' {
  const assets: { lessons: Record<string, string>; searchIndex: string; audioScopes: Record<string, string> }
  export default assets
}
declare module 'virtual:n1-audio-client' {
  const audio: import('./lib/audioClientTypes.ts').ClientAudioAvailability
  export default audio
}
declare module 'virtual:n1-compound-catalog' {
  const catalog: import('./lib/compoundCatalog.ts').CompoundCatalogEntry[]
  export default catalog
}
declare module 'virtual:n1-note-search' {
  const index: import('./lib/searchIndexCodec.ts').PackedProjectNotesIndex
  export default index
}
