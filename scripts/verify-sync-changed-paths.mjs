import { pathToFileURL } from 'node:url';

export function verifySyncChangedPaths(date, changedPaths) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid sync target date');
  const allowed = new Set([`src/data/daily/${date}.json`, 'src/data/it-study-snapshot.json']);
  const paths = changedPaths.split('\n').filter(Boolean);
  if (!paths.length || paths.some(path => !allowed.has(path))) throw new Error('Unexpected sync content paths');
  return paths;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifySyncChangedPaths(process.argv[2] ?? '', process.argv[3] ?? '');
}
