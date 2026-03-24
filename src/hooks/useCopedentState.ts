import { useState, useCallback, useEffect } from 'react'
import type { Copedent, NoteDisplayMode } from '../types'
import { loadCopedents, saveCopedents } from '../utils/storage'

export function useCopedentState() {
  const [copedents, setCopedents] = useState<Copedent[]>(() => loadCopedents())
  const [activeCopedentId, setActiveCopedentId] = useState<string>(() => copedents[0].id)
  const [engagedControls, setEngagedControls] = useState<Set<string>>(new Set())
  const [displayMode, setDisplayMode] = useState<NoteDisplayMode>('letters')
  const [selectedKey, setSelectedKey] = useState('C')

  // Persist on change
  useEffect(() => {
    saveCopedents(copedents)
  }, [copedents])

  const activeCopedent = copedents.find(c => c.id === activeCopedentId) ?? copedents[0]

  const switchCopedent = useCallback((id: string) => {
    setActiveCopedentId(id)
    setEngagedControls(new Set())
  }, [])

  const toggleControl = useCallback((control: string) => {
    setEngagedControls(prev => {
      const next = new Set(prev)
      if (next.has(control)) next.delete(control)
      else next.add(control)
      return next
    })
  }, [])

  const clearAllControls = useCallback(() => {
    setEngagedControls(new Set())
  }, [])

  const updateCopedent = useCallback((id: string, updates: Partial<Copedent>) => {
    setCopedents(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  const duplicateCopedent = useCallback((id: string) => {
    setCopedents(prev => {
      const source = prev.find(c => c.id === id)
      if (!source) return prev
      const copy: Copedent = {
        ...structuredClone(source),
        id: crypto.randomUUID(),
        name: `${source.name} (Copy)`,
      }
      return [...prev, copy]
    })
  }, [])

  const deleteCopedent = useCallback((id: string) => {
    setCopedents(prev => {
      if (prev.length <= 1) return prev
      const next = prev.filter(c => c.id !== id)
      if (activeCopedentId === id) {
        setActiveCopedentId(next[0].id)
        setEngagedControls(new Set())
      }
      return next
    })
  }, [activeCopedentId])

  const createCopedent = useCallback((copedent: Copedent) => {
    setCopedents(prev => [...prev, copedent])
    setActiveCopedentId(copedent.id)
    setEngagedControls(new Set())
  }, [])

  return {
    copedents,
    activeCopedent,
    activeCopedentId,
    engagedControls,
    displayMode,
    selectedKey,
    setActiveCopedentId: switchCopedent,
    toggleControl,
    clearAllControls,
    setDisplayMode,
    setSelectedKey,
    updateCopedent,
    duplicateCopedent,
    deleteCopedent,
    createCopedent,
  }
}
