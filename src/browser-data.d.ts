declare module 'virtual:n1-catalog' {
  const catalog: import('./lib/lessonDataTypes.ts').BrowserCatalog
  export default catalog
}
declare module 'virtual:n1-data-assets' {
  const assets: { lessons: Record<string, string>; searchIndex: string }
  export default assets
}
declare module 'virtual:n1-audio-client' {
  const audio: import('./lib/audioClientTypes.ts').ClientAudioIndex
  export default audio
}
