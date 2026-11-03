import { create } from 'zustand'
import { db } from '../db/db'
import { DEFAULT_LABELS, LABELS_VERSION } from '../domain/labels'
import type { Labels } from '../domain/types'

export type Theme = 'dark' | 'light'

export interface SettingsState {
  labels: Labels
  email: string
  theme: Theme
  noteHistory: string[]
  loaded: boolean
  load(): Promise<void>
  setLabels(labels: Labels): Promise<void>
  resetLabels(): Promise<void>
  setEmail(email: string): Promise<void>
  setTheme(theme: Theme): Promise<void>
  rememberNote(note: string): Promise<void>
}

const applyTheme = (theme: Theme) => {
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme
}

export function createSettingsStore() {
  return create<SettingsState>((set, get) => ({
    labels: DEFAULT_LABELS,
    email: '',
    theme: 'dark',
    noteHistory: [],
    loaded: false,

    async load() {
      const rows = await db.settings.toArray()
      const get = <T,>(key: string, fallback: T): T => (rows.find((r) => r.key === key)?.value as T) ?? fallback
      const theme = get<Theme>('theme', 'dark')
      applyTheme(theme)
      const saved = get<Partial<Labels>>('labels', {})
      // A new play sheet replaces labels saved from an older one.
      const labels = saved.version === LABELS_VERSION ? { ...DEFAULT_LABELS, ...saved } : DEFAULT_LABELS
      set({ labels, email: get('email', ''), theme, noteHistory: get<string[]>('noteHistory', []), loaded: true })
    },

    async setLabels(labels) {
      const next = { ...labels, version: LABELS_VERSION }
      await db.settings.put({ key: 'labels', value: next })
      set({ labels: next })
    },

    async resetLabels() {
      await db.settings.delete('labels')
      set({ labels: DEFAULT_LABELS })
    },

    async setEmail(email) {
      await db.settings.put({ key: 'email', value: email })
      set({ email })
    },

    async rememberNote(note) {
      const noteHistory = [note, ...get().noteHistory.filter((n) => n.toLowerCase() !== note.toLowerCase())].slice(0, 100)
      await db.settings.put({ key: 'noteHistory', value: noteHistory })
      set({ noteHistory })
    },

    async setTheme(theme) {
      await db.settings.put({ key: 'theme', value: theme })
      applyTheme(theme)
      set({ theme })
    },
  }))
}

export const useSettings = createSettingsStore()
