import type { DailyLesson } from '../types.ts'
import type { ReviewFocus } from './archive.ts'

export interface BrowserLesson { lesson: DailyLesson; reviewFocus: ReviewFocus[] }
export interface BrowserHistoryItem { date: string; day: number; title: string; minutes: number; merged: boolean }
export interface BrowserCatalog { latest: BrowserLesson; historyItems: BrowserHistoryItem[] }
