import Dexie, { type Table } from 'dexie'
import type { Game, Possession } from '../domain/types'

export interface Setting {
  key: string
  value: unknown
}

export class OffenseDB extends Dexie {
  games!: Table<Game, string>
  possessions!: Table<Possession, string>
  settings!: Table<Setting, string>

  constructor() {
    super('hc-offense')
    this.version(1).stores({
      games: 'id,status,date',
      possessions: 'id,gameId,[gameId+n]',
      settings: 'key',
    })
  }
}

export const db = new OffenseDB()

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
