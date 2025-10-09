import { create } from 'zustand'
import { Vector3 } from 'three'
import { sceneDataMap } from '../data/sceneData'
import type { ScenePointData } from '../data/sceneData'

export interface ScenePoint extends ScenePointData {
  visited: boolean
  rotation?: Vector3
  scale?: number
}

export type SceneThemeType = string

export interface SceneMeta {
  id: SceneThemeType
  name: string
  description: string
  icon?: string
  items?: string[]
}

export interface SceneExportPayload {
  version: string
  exportedAt: string
  currentTheme: SceneThemeType
  custom: Record<SceneThemeType, ScenePointData[]>
  deleted: Record<SceneThemeType, string[]>
  meta: Record<SceneThemeType, SceneMeta>
}

const DEFAULT_SCENE_META: Record<SceneThemeType, SceneMeta> = {
  museum: {
    id: 'museum',
    name: '博物馆',
    description: '探索中国传统文物，了解悠久历史',
    icon: '🏺',
    items: ['商代青铜鼎', '唐代丝绸画卷', '战国玉璧'],
  },
  redMansion: {
    id: 'redMansion',
    name: '红楼梦',
    description: '走进大观园，体验红楼梦的诗意世界',
    icon: '🏮',
    items: ['大观园正门', '怡红院', '潇湘馆'],
  },
  silkRoad: {
    id: 'silkRoad',
    name: '丝绸之路',
    description: '穿越古丝绸之路，见证东西文化交流',
    icon: '🐫',
    items: ['长安城', '敦煌莫高窟', '撒马尔罕'],
  },
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

interface GameState {
  playerPosition: Vector3
  isPointerLocked: boolean
  currentTheme: SceneThemeType
  scenePoints: ScenePoint[]
  currentPoint: ScenePoint | null
  showSceneSelector: boolean
  isTransitioning: boolean
  selectedPointId: string | null
  placingModelPath: string | null
  messages: Message[]
  isAILoading: boolean
  showChat: boolean
  showInstructions: boolean
  showSceneInfo: boolean
  sceneMeta: Record<SceneThemeType, SceneMeta>
  setPlayerPosition: (position: Vector3) => void
  setPointerLocked: (locked: boolean) => void
  setCurrentPoint: (point: ScenePoint | null) => void
  markPointVisited: (pointId: string) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setAILoading: (loading: boolean) => void
  setShowChat: (show: boolean) => void
  toggleChat: () => void
  setShowInstructions: (show: boolean) => void
  clearMessages: () => void
  addScenePoint: (point: ScenePointData) => void
  deleteScenePoint: (pointId: string) => void
  updateScenePoint: (pointId: string, partial: Partial<ScenePointData>) => void
  setSelectedPoint: (pointId: string | null) => void
  setPlacingModelPath: (path: string | null) => void
  switchScene: (theme: SceneThemeType) => void
  setShowSceneSelector: (show: boolean) => void
  setIsTransitioning: (transitioning: boolean) => void
  exportConfiguration: () => SceneExportPayload
  importConfiguration: (payload: SceneExportPayload) => Promise<{ ok: boolean; missingModels?: string[] }>
  createNewScene: (theme: SceneThemeType, options: { name: string; description: string; defaultPrompt: string; icon?: string }) => void
}

type Overrides = {
  custom: Record<SceneThemeType, ScenePointData[]>
  deleted: Record<SceneThemeType, string[]>
  meta: Record<SceneThemeType, SceneMeta>
}

const STORAGE_KEY = 'scene-overrides-v1'

function loadOverrides(): Overrides {
  const fallback: Overrides = {
    custom: {},
    deleted: {},
    meta: { ...DEFAULT_SCENE_META },
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return {
      custom: parsed.custom || {},
      deleted: parsed.deleted || {},
      meta: { ...DEFAULT_SCENE_META, ...(parsed.meta || {}) },
    }
  } catch {
    return fallback
  }
}

function saveOverrides(data: Overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function initializeScenePoints(theme: SceneThemeType, overrides?: Overrides): ScenePoint[] {
  const source = overrides ?? loadOverrides()
  const base = sceneDataMap[theme] || []
  const deletedIds = new Set(source.deleted[theme] || [])
  const filtered = base.filter(p => !deletedIds.has(p.id))
  const merged: ScenePointData[] = [...filtered, ...(source.custom[theme] || [])]
  return merged.map(point => ({ ...point, visited: false }))
}

const initialOverrides = loadOverrides()

export const useStore = create<GameState>((set, get) => ({
  playerPosition: new Vector3(0, 1.6, 10),
  isPointerLocked: false,
  currentTheme: 'museum',
  scenePoints: initializeScenePoints('museum', initialOverrides),
  currentPoint: null,
  showSceneSelector: false,
  isTransitioning: false,
  selectedPointId: null,
  placingModelPath: null,
  messages: [],
  isAILoading: false,
  showChat: false,
  showInstructions: true,
  showSceneInfo: false,
  sceneMeta: initialOverrides.meta,
  setPlayerPosition: (position) => set({ playerPosition: position }),
  setPointerLocked: (locked) => set({ isPointerLocked: locked }),
  setCurrentPoint: (point) => {
    const { currentPoint, addMessage } = get()
    if (point && point.id !== currentPoint?.id) {
      set({ currentPoint: point, showSceneInfo: true })
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: `欢迎来到【${point.name}】\n\n${point.aiContext}`,
        })
        set({ showChat: true })
      }, 500)
    } else if (!point && currentPoint) {
      set({ currentPoint: null, showSceneInfo: false })
    }
  },
  markPointVisited: (pointId) =>
    set((state) => ({
      scenePoints: state.scenePoints.map((point) =>
        point.id === pointId ? { ...point, visited: true } : point
      ),
    })),
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
        },
      ],
    })),
  setAILoading: (loading) => set({ isAILoading: loading }),
  setShowChat: (show) => set({ showChat: show }),
  toggleChat: () => set((state) => ({ showChat: !state.showChat })),
  setShowInstructions: (show) => set({ showInstructions: show }),
  clearMessages: () => set({ messages: [] }),
  switchScene: (theme) => {
    const overrides = loadOverrides()
    const meta = overrides.meta || DEFAULT_SCENE_META
    set({
      isTransitioning: true,
      showSceneSelector: false,
      sceneMeta: meta,
    })
    setTimeout(() => {
      set({
        currentTheme: theme,
        scenePoints: initializeScenePoints(theme, overrides),
        currentPoint: null,
        messages: [],
        playerPosition: new Vector3(0, 1.6, 10),
        isPointerLocked: false,
        selectedPointId: null,
      })
    }, 100)
    setTimeout(() => {
      set({ isTransitioning: false })
    }, 1500)
  },
  setShowSceneSelector: (show) => set({ showSceneSelector: show }),
  setIsTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
  addScenePoint: (point) => {
    const theme = get().currentTheme
    const overrides = loadOverrides()
    overrides.custom[theme] = [...(overrides.custom[theme] || []), point]
    saveOverrides(overrides)
    set((state) => ({
      scenePoints: [...state.scenePoints, { ...point, visited: false }],
    }))
  },
  deleteScenePoint: (pointId) => {
    const theme = get().currentTheme
    const overrides = loadOverrides()
    overrides.custom[theme] = (overrides.custom[theme] || []).filter(p => p.id !== pointId)
    const baseHas = (sceneDataMap[theme] || []).some(p => p.id === pointId)
    if (baseHas) {
      overrides.deleted[theme] = [...(overrides.deleted[theme] || []), pointId]
    }
    saveOverrides(overrides)
    set((state) => ({
      scenePoints: state.scenePoints.filter(p => p.id !== pointId),
      currentPoint: state.currentPoint?.id === pointId ? null : state.currentPoint,
      selectedPointId: state.selectedPointId === pointId ? null : state.selectedPointId,
    }))
  },
  updateScenePoint: (pointId, partial) => {
    const theme = get().currentTheme
    const overrides = loadOverrides()
    let list = overrides.custom[theme] || []
    const idx = list.findIndex(p => p.id === pointId)
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...partial, position: partial.position ?? list[idx].position }
    } else {
      const base = (sceneDataMap[theme] || []).find(p => p.id === pointId)
      if (base) {
        list = [...list, { ...base, ...partial, position: partial.position ?? base.position }]
      }
    }
    overrides.custom[theme] = list
    saveOverrides(overrides)
    set((state) => ({
      scenePoints: state.scenePoints.map(p => p.id === pointId ? { ...p, ...partial, position: partial.position ?? p.position } : p),
    }))
  },
  setSelectedPoint: (pointId) => set({ selectedPointId: pointId }),
  setPlacingModelPath: (path) => set({ placingModelPath: path }),
  exportConfiguration: () => ({
    version: '1.1.0',
    exportedAt: new Date().toISOString(),
    currentTheme: get().currentTheme,
    custom: loadOverrides().custom,
    deleted: loadOverrides().deleted,
    meta: get().sceneMeta,
  }),
  importConfiguration: async (payload) => {
    try {
      if (!payload || !payload.version || !payload.custom || !payload.deleted) {
        throw new Error('配置格式不正确')
      }
      const response = await fetch('/models/index.json')
      const data = await response.json()
      const available = new Set<string>((data.files || []) as string[])
      const missing: string[] = []
      Object.values(payload.custom).forEach((points) => {
        points?.forEach((p) => {
          if (p?.modelPath && !available.has(p.modelPath)) {
            missing.push(p.modelPath)
          }
        })
      })
      const mergedMeta = { ...DEFAULT_SCENE_META, ...(payload.meta || {}) }
      const overrides: Overrides = {
        custom: payload.custom,
        deleted: payload.deleted,
        meta: mergedMeta,
      }
      saveOverrides(overrides)
      const theme = payload.currentTheme || 'museum'
      set({
        sceneMeta: mergedMeta,
        currentTheme: theme,
        scenePoints: initializeScenePoints(theme, overrides),
        currentPoint: null,
        selectedPointId: null,
      })
      return { ok: missing.length === 0, missingModels: missing }
    } catch (error) {
      console.error('导入配置失败:', error)
      return { ok: false }
    }
  },
  createNewScene: (theme, options) => {
    const id = theme.trim()
    if (!id) return
    const overrides = loadOverrides()
    const defaultPoint: ScenePointData = {
      id: `${id}-intro-${Date.now()}`,
      name: options.name,
      position: new Vector3(0, 0, 0),
      radius: 5,
      description: options.description,
      aiContext: options.defaultPrompt,
      modelPath: '',
    }
    overrides.custom[id] = [defaultPoint]
    overrides.deleted[id] = []
    overrides.meta[id] = {
      id,
      name: options.name,
      description: options.description,
      icon: options.icon || '🎭',
    }
    saveOverrides(overrides)
    sceneDataMap[id] = sceneDataMap[id] || []
    set({
      sceneMeta: overrides.meta,
      currentTheme: id,
      scenePoints: initializeScenePoints(id, overrides),
      currentPoint: null,
      selectedPointId: null,
      showSceneSelector: false,
    })
  },
}))
