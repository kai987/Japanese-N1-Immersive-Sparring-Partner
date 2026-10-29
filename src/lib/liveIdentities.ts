import type { LiveReactionEntry, LiveReactionExample } from '../data/live-reactions.ts'
import type { LiveUnit } from '../data/live-reaction-units.ts'

export const liveEntryAudioReference = (entry: LiveReactionEntry) => entry.legacyAudioRef ?? 'entry/' + entry.id
export const liveExampleAudioReference = (example: LiveReactionExample) => example.legacyAudioRef ?? 'example/' + example.id

export function liveUnitCountLabel(groups: LiveUnit['groups']): string {
  const supplements = groups.filter(group => group.supplement).length
  return supplements ? (groups.length - supplements) + ' 个核心知识点＋' + supplements + ' 组补充'
    : groups.length + ' 组知识点 · ' + groups.reduce((sum, group) => sum + group.entries.length, 0) + ' 条表达'
}

/** Fail during import/build instead of silently changing saved progress or published audio. */
export function validateLiveIdentities(units: readonly LiveUnit[]): void {
  const unitIds = new Set<string>(), groupIds = new Set<string>(), itemIds = new Set<string>()
  const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  const unique = (value: string, seen: Set<string>, kind: string) => {
    if (!validId(value) || seen.has(value)) throw new Error('Invalid or duplicate live ' + kind + ' ID: ' + value)
    seen.add(value)
  }
  for (const unit of units) {
    unique(unit.id, unitIds, 'unit')
    for (const group of unit.groups) {
      unique(group.id, groupIds, 'group')
      const aliases = new Set<string>()
      for (const item of group.entries) {
        unique(item.id, itemIds, 'entry')
        if (!item.expression?.trim() || !item.reading?.trim() || !item.meaning?.trim()) throw new Error('Incomplete live entry: ' + item.id)
        const ref = liveEntryAudioReference(item)
        if (!ref.startsWith('entry/') || ref.length <= 6 || /[\u0000-\u001f]/u.test(ref) || aliases.has(ref)) throw new Error('Invalid or duplicate live audio reference: ' + ref)
        aliases.add(ref)
      }
      for (const item of group.examples) {
        unique(item.id, itemIds, 'example')
        if (!item.japanese?.trim() || !item.chinese?.trim()) throw new Error('Incomplete live example: ' + item.id)
        const ref = liveExampleAudioReference(item)
        if (!ref.startsWith('example/') || ref.length <= 8 || /[\u0000-\u001f]/u.test(ref) || aliases.has(ref)) throw new Error('Invalid or duplicate live audio reference: ' + ref)
        aliases.add(ref)
      }
    }
  }
}
