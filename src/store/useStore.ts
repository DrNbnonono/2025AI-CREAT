import { create } from 'zustand'
import { Vector3 } from 'three'
import { sceneDataMap, defaultSceneMeta, type ScenePointData, type SceneMeta } from '../data/sceneData'

export interface SerializableVector {
  x: number
  y: number
  z: number
}

export type ScenePointSerialized = Omit<ScenePointData, 'position' | 'rotation'> & {
  position: SerializableVector
  rotation?: SerializableVector
}

interface PersistedOverrides {
  custom?: Record<SceneThemeType, ScenePointSerialized[]>
  deleted?: Record<SceneThemeType, string[]>
  meta?: Record<SceneThemeType, SceneMeta>
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function normalizeVector(value: unknown, fallback: SerializableVector = { x: 0, y: 0, z: 0 }): Vector3 {
  if (value instanceof Vector3) {
    return value.clone()
  }
  if (value && typeof value === 'object') {
    const candidate = value as Partial<SerializableVector>
    const x = Number.isFinite(candidate.x) ? Number(candidate.x) : fallback.x
    const y = Number.isFinite(candidate.y) ? Number(candidate.y) : fallback.y
    const z = Number.isFinite(candidate.z) ? Number(candidate.z) : fallback.z
    return new Vector3(x, y, z)
  }
  return new Vector3(fallback.x, fallback.y, fallback.z)
}

function normalizePoint(point: ScenePointData | ScenePointSerialized | ScenePoint): ScenePointData {
  const { position, rotation, visited: _visited, ...rest } = point as ScenePointData & ScenePointSerialized & ScenePoint
  const normalizedPosition = normalizeVector(position)
  const normalizedRotation = rotation != null ? normalizeVector(rotation) : undefined
  const scale = typeof (rest as any).scale === 'number' ? (rest as any).scale : undefined

  return {
    ...(rest as Omit<ScenePointData, 'position' | 'rotation'>),
    position: normalizedPosition,
    rotation: normalizedRotation,
    scale,
  }
}

function serializeVector3(value?: Vector3): SerializableVector | undefined {
  if (!value) return undefined
  return {
    x: Number.isFinite(value.x) ? value.x : 0,
    y: Number.isFinite(value.y) ? value.y : 0,
    z: Number.isFinite(value.z) ? value.z : 0,
  }
}

function serializePoint(point: ScenePointData): ScenePointSerialized {
  const normalized = normalizePoint(point)
  const { position, rotation, ...rest } = normalized
  const serialized: ScenePointSerialized = {
    ...(rest as Omit<ScenePointData, 'position' | 'rotation'>),
    position: {
      x: position.x,
      y: position.y,
      z: position.z,
    },
  }
  if (rotation) {
    serialized.rotation = {
      x: rotation.x,
      y: rotation.y,
      z: rotation.z,
    }
  }
  return serialized
}

function mergeSceneMeta(metaInput: Record<SceneThemeType, SceneMeta> | undefined, custom: Record<SceneThemeType, ScenePointData[]>): Record<SceneThemeType, SceneMeta> {
  const merged: Record<SceneThemeType, SceneMeta> = { ...defaultSceneMeta }

  if (metaInput) {
    Object.entries(metaInput).forEach(([theme, meta]) => {
      if (!meta) return
      merged[theme as SceneThemeType] = {
        id: meta.id || (theme as SceneThemeType),
        name: meta.name || meta.id || (theme as SceneThemeType),
        description: meta.description || '管理员自定义场景',
        icon: meta.icon,
        items: meta.items,
      }
    })
  }

  Object.keys(custom || {}).forEach((theme) => {
    if (!merged[theme]) {
      merged[theme] = {
        id: theme,
        name: `自定义场景 ${theme}`,
        description: '管理员自定义场景',
        icon: '🧭',
      }
    }
  })

  return merged
}

function stripDefaultSceneMeta(meta: Record<SceneThemeType, SceneMeta>): Record<SceneThemeType, SceneMeta> {
  const result: Record<SceneThemeType, SceneMeta> = {}

  Object.entries(meta).forEach(([theme, metaValue]) => {
    const defaults = defaultSceneMeta[theme]
    if (!defaults) {
      result[theme as SceneThemeType] = metaValue
      return
    }

    const itemsEquals = JSON.stringify(defaults.items ?? []) === JSON.stringify(metaValue.items ?? [])
    if (
      defaults.name !== metaValue.name ||
      defaults.description !== metaValue.description ||
      defaults.icon !== metaValue.icon ||
      !itemsEquals
    ) {
      result[theme as SceneThemeType] = metaValue
    }
  })

  return result
}

function collectAvailableScenes(meta: Record<SceneThemeType, SceneMeta>, custom: Record<SceneThemeType, ScenePointData[]>): SceneThemeType[] {
  const themes = new Set<SceneThemeType>()
  Object.keys(defaultSceneMeta).forEach((key) => themes.add(key))
  Object.keys(sceneDataMap).forEach((key) => themes.add(key))
  Object.keys(meta).forEach((key) => themes.add(key))
  Object.keys(custom).forEach((key) => themes.add(key))
  return Array.from(themes)
}

// 场景点位配置
export interface ScenePoint extends ScenePointData {
  visited: boolean
}

export interface SceneExportPayload {
  version: string
  exportedAt: string
  currentTheme: SceneThemeType
  custom: Record<SceneThemeType, ScenePointSerialized[]>
  deleted: Record<SceneThemeType, string[]>
  meta: Record<SceneThemeType, SceneMeta>
}

// 场景主题类型
export type SceneThemeType = string

// AI消息
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

interface GameState {
  // 玩家状态
  playerPosition: Vector3
  isPointerLocked: boolean
  
  // 场景管理
  currentTheme: SceneThemeType
  scenePoints: ScenePoint[]
  currentPoint: ScenePoint | null
  showSceneSelector: boolean
  isTransitioning: boolean
  availableScenes: SceneThemeType[]
  sceneMeta: Record<SceneThemeType, SceneMeta>
  // Admin selection / placement
  selectedPointId: string | null
  placingModelPath: string | null
  
  // AI对话
  messages: Message[]
  isAILoading: boolean
  showChat: boolean
  
  // UI状态
  showInstructions: boolean
  showSceneInfo: boolean
  
  // Actions
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
  // 模型点位编辑
  addScenePoint: (point: ScenePointData) => void
  deleteScenePoint: (pointId: string) => void
  updateScenePoint: (pointId: string, partial: Partial<ScenePointData>) => void
  setSelectedPoint: (pointId: string | null) => void
  setPlacingModelPath: (path: string | null) => void
  switchScene: (theme: SceneThemeType) => void
  setShowSceneSelector: (show: boolean) => void
  setIsTransitioning: (transitioning: boolean) => void
  // 场景配置管理
  exportConfiguration: () => SceneExportPayload
  importConfiguration: (payload: SceneExportPayload) => Promise<{ ok: boolean; missingModels?: string[] }>
  createNewScene: (theme: SceneThemeType, options: { name: string; description: string; defaultPrompt: string; icon?: string }) => void
}

// 初始化场景点位
// 覆盖数据结构（本地持久化）
type Overrides = {
  custom: Record<SceneThemeType, ScenePointData[]>
  deleted: Record<SceneThemeType, string[]>
  meta: Record<SceneThemeType, SceneMeta>
}

const OVERRIDE_KEY = 'scene-overrides-v2'

function normalizeOverrides(overrides: PersistedOverrides | null): Overrides {
  const custom: Record<SceneThemeType, ScenePointData[]> = {}
  const deleted: Record<SceneThemeType, string[]> = {}

  if (overrides?.custom) {
    Object.entries(overrides.custom).forEach(([theme, list]) => {
      if (!Array.isArray(list)) return
      custom[theme] = list.map((point) => normalizePoint(point))
    })
  }

  if (overrides?.deleted) {
    Object.entries(overrides.deleted).forEach(([theme, ids]) => {
      if (!Array.isArray(ids)) return
      deleted[theme] = ids.filter((id): id is string => typeof id === 'string')
    })
  }

  const mergedMeta = mergeSceneMeta(overrides?.meta, custom)

  return {
    custom,
    deleted,
    meta: mergedMeta,
  }
}

export function loadOverrides(): Overrides {
  const storage = getLocalStorage()
  if (!storage) {
    return normalizeOverrides(null)
  }

  try {
    const raw = storage.getItem(OVERRIDE_KEY)
    if (!raw) return normalizeOverrides(null)
    const parsed = JSON.parse(raw) as PersistedOverrides
    return normalizeOverrides(parsed)
  } catch (error) {
    console.warn('加载场景覆盖数据失败，使用默认值', error)
    return normalizeOverrides(null)
  }
}

function saveOverrides(data: Overrides) {
  const storage = getLocalStorage()
  if (!storage) return

  const persisted: PersistedOverrides = {
    custom: {},
    deleted: {},
    meta: stripDefaultSceneMeta(data.meta),
  }

  Object.entries(data.custom).forEach(([theme, list]) => {
    if (!list?.length) return
    persisted.custom![theme] = list.map((point) => serializePoint(point))
  })

  Object.entries(data.deleted).forEach(([theme, ids]) => {
    if (!ids?.length) return
    persisted.deleted![theme] = ids
  })

  storage.setItem(OVERRIDE_KEY, JSON.stringify(persisted))
}

function initializeScenePoints(theme: SceneThemeType, overrides?: Overrides): ScenePoint[] {
  const source = overrides ?? loadOverrides()
  const baseSource = sceneDataMap[theme] || []
  const base = baseSource.map((point) => normalizePoint(point))
  const deletedIds = new Set(source.deleted[theme] || [])
  const customPoints = (source.custom[theme] || []).map((point) => normalizePoint(point))
  const filtered = base.filter((p) => !deletedIds.has(p.id))
  const merged: ScenePointData[] = [...filtered, ...customPoints]
  return merged.map((point) => ({ ...point, visited: false }))
}

function computeAvailableScenes(meta: Record<SceneThemeType, SceneMeta>, custom: Record<SceneThemeType, ScenePointData[]>): SceneThemeType[] {
  return collectAvailableScenes(meta, custom)
}

export const useStore = create<GameState>((set, get) => {
  const overrides = loadOverrides()

  return {
    // 初始状态
    playerPosition: new Vector3(0, 1.6, 10),
    isPointerLocked: false,
    
    // 场景管理
    currentTheme: 'museum',
    scenePoints: initializeScenePoints('museum', overrides),
    showSceneSelector: false,
    isTransitioning: false,
    availableScenes: computeAvailableScenes(overrides.meta, overrides.custom),
    sceneMeta: overrides.meta,
    // Admin selection / placement
    selectedPointId: null,
    placingModelPath: null,
    
    currentPoint: null,
    messages: [],
    isAILoading: false,
    showChat: false,
    showInstructions: true,
    showSceneInfo: false,
    
    // Actions 实现
    setPlayerPosition: (position) => set({ playerPosition: position }),
    
    setPointerLocked: (locked) => set({ isPointerLocked: locked }),
    
    setCurrentPoint: (point) => {
    const { currentPoint, addMessage } = get()
    
    // 如果进入新的场景点
    if (point && point.id !== currentPoint?.id) {
      set({ currentPoint: point, showSceneInfo: true })
      
      // 自动触发AI讲解
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: `欢迎来到【${point.name}】\n\n${point.aiContext}`,
        })
        set({ showChat: true })
      }, 500)
    } else if (!point && currentPoint) {
      // 离开场景点
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
  
  // 场景切换（带过场动画）
  switchScene: (theme) => {
    const overrides = loadOverrides()
    set({
      isTransitioning: true,
      showSceneSelector: false,
      sceneMeta: overrides.meta,
      availableScenes: computeAvailableScenes(overrides.meta, overrides.custom),
    })
    
    setTimeout(() => {
      set({
        currentTheme: theme,
        scenePoints: initializeScenePoints(theme, overrides),
        currentPoint: null,
        messages: [],
        playerPosition: new Vector3(0, 1.6, 10),
        isPointerLocked: false,
      })
    }, 100)
    
    setTimeout(() => {
      set({ isTransitioning: false })
    }, 1500)
  },

  // 添加场景点位（持久化到 localStorage）
  addScenePoint: (point) => {
    const theme = get().currentTheme
    // 更新内存
    set((state) => ({
      scenePoints: [...state.scenePoints, { ...point, visited: false }],
    }))
    // 更新本地覆盖
    const overrides = loadOverrides()
    overrides.custom[theme] = [...(overrides.custom[theme] || []), point]
    saveOverrides(overrides)
  },

  // 删除场景点位（支持删除默认与自定义）
  deleteScenePoint: (pointId) => {
    const theme = get().currentTheme
    // 更新内存
    set((state) => ({
      scenePoints: state.scenePoints.filter(p => p.id !== pointId),
      currentPoint: state.currentPoint?.id === pointId ? null : state.currentPoint,
      selectedPointId: state.selectedPointId === pointId ? null : state.selectedPointId,
    }))
    // 更新本地覆盖
    const overrides = loadOverrides()
    // 先尝试从 custom 删除
    overrides.custom[theme] = (overrides.custom[theme] || []).filter(p => p.id !== pointId)
    // 如果不是自定义的，则记录为删除默认点位
    const baseHas = sceneDataMap[theme].some(p => p.id === pointId)
    if (baseHas) {
      if (!overrides.deleted[theme].includes(pointId)) overrides.deleted[theme].push(pointId)
    }
    saveOverrides(overrides)
  },

  // 更新场景点位
  updateScenePoint: (pointId, partial) => {
    const theme = get().currentTheme
    set((state) => ({
      scenePoints: state.scenePoints.map(p => p.id === pointId ? { ...p, ...partial, position: partial.position ?? p.position } : p),
    }))
    // 更新覆盖
    const overrides = loadOverrides()
    let list = overrides.custom[theme] || []
    const idx = list.findIndex(p => p.id === pointId)
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...partial, position: partial.position ?? list[idx].position }
    } else {
      // 如果原本是内置点，写入一条覆盖条目
      const base = sceneDataMap[theme].find(p => p.id === pointId)
      if (base) {
        list = [...list, { ...base, ...partial, position: partial.position ?? base.position }]
      }
    }
    overrides.custom[theme] = list
    saveOverrides(overrides)
  },

  setSelectedPoint: (pointId) => set({ selectedPointId: pointId }),
  setPlacingModelPath: (path) => set({ placingModelPath: path }),
  
  setShowSceneSelector: (show) => set({ showSceneSelector: show }),
  setIsTransitioning: (transitioning) => set({ isTransitioning: transitioning }),

  exportConfiguration: () => {
    const overrides = loadOverrides()
    return {
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      currentTheme: get().currentTheme,
      custom: overrides.custom,
      deleted: overrides.deleted,
      meta: overrides.meta,
    }
  },

  importConfiguration: async (payload) => {
    try {
      if (!payload || !payload.version || !payload.custom || !payload.deleted || !payload.meta) {
        throw new Error('配置格式不正确')
      }

      const response = await fetch('/models/index.json')
      const data = await response.json()
      const available = new Set<string>((data.files || []) as string[])
      const missing: string[] = []

      Object.values(payload.custom).forEach((points) => {
        points?.forEach((p) => {
          if (p.modelPath && !available.has(p.modelPath)) {
            missing.push(p.modelPath)
          }
        })
      })

      saveOverrides({
        custom: payload.custom,
        deleted: payload.deleted,
        meta: payload.meta,
      })

      const theme = payload.currentTheme || 'museum'
      set({
        currentTheme: theme,
        scenePoints: initializeScenePoints(theme),
        currentPoint: null,
        selectedPointId: null,
        sceneMeta: payload.meta,
        availableScenes: computeAvailableScenes(payload.meta, payload.custom),
      })

      return { ok: missing.length === 0, missingModels: missing }
    } catch (error) {
      console.error('导入配置失败:', error)
      return { ok: false }
    }
  },

  createNewScene: (theme, options) => {
    const overrides = loadOverrides()
    if (!sceneDataMap[theme]) {
      sceneDataMap[theme] = []
    }
    if (!overrides.custom[theme]) overrides.custom[theme] = []
    if (!overrides.deleted[theme]) overrides.deleted[theme] = []

    const defaultPoint: ScenePointData = {
      id: `${theme}-intro-${Date.now()}`,
      name: options.name,
      position: new Vector3(0, 0, 0),
      radius: 5,
      description: options.description,
      aiContext: options.defaultPrompt,
      modelPath: '',
    }

    overrides.custom[theme] = [defaultPoint]
    overrides.meta[theme] = {
      id: theme,
      name: options.name,
      description: options.description,
      icon: options.icon || '🎭',
    }
    saveOverrides(overrides)

    set({
      currentTheme: theme,
      scenePoints: initializeScenePoints(theme, overrides),
      currentPoint: null,
      selectedPointId: null,
      showSceneSelector: false,
      sceneMeta: overrides.meta,
      availableScenes: computeAvailableScenes(overrides.meta, overrides.custom),
    })
  },
  }
})
