import { searchProject as searchPreparedProject, type LessonSearchIndex, type ProjectSearchOptions } from '../../src/lib/projectSearch.ts'
import { createNoteSearchData } from '../../scripts/lib/noteSearchData.ts'
export { createLessonSearchIndex } from '../../src/lib/projectSearch.ts'

const notes = createNoteSearchData()
export const searchProject = (query: string, index: LessonSearchIndex, options: ProjectSearchOptions = {}) =>
  searchPreparedProject(query, index, { ...options, notes })
