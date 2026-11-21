import { compoundVerbSeries } from '../../src/data/compound-verbs.ts'
import { liveUnits } from '../../src/data/live-reaction-units.ts'
import { createProjectNotesIndex } from '../../src/lib/projectSearch.ts'
import { normalizeSearchText } from '../../src/lib/searchHighlight.ts'

export const createNoteSearchData = () => createProjectNotesIndex(compoundVerbSeries, liveUnits)
export const createCompoundCatalog = () => compoundVerbSeries.map(series => ({ id: series.id, title: series.title,
  words: [...new Set([...series.triggers, ...series.groups.flatMap(group => group.words.map(entry => entry.word))].map(normalizeSearchText))] }))
