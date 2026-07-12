import Dexie, { type EntityTable } from 'dexie'
import type { PersistedWorkspace } from '../types'

class LocalPdfDatabase extends Dexie {
  workspaces!: EntityTable<PersistedWorkspace, 'id'>

  constructor() {
    super('local-pdf')
    this.version(1).stores({ workspaces: 'id,savedAt' })
  }
}

export const db = new LocalPdfDatabase()

export async function loadWorkspace() {
  return db.workspaces.get('active')
}

export async function saveWorkspace(workspace: PersistedWorkspace) {
  await db.workspaces.put(workspace)
}

export async function clearWorkspace() {
  await db.workspaces.delete('active')
}

export async function getStorageEstimate() {
  if (!navigator.storage?.estimate) return null
  return navigator.storage.estimate()
}
