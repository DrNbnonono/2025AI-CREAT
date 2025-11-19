// 场景状态管理存储
// 用于存储场景中的点数据、用户位置、旋转、缩放等状态
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
        defaultPrompt: meta.defaultPrompt,
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
  groundBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | null
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
  setGroundBounds: (bounds: { minX: number; maxX: number; minZ: number; maxZ: number } | null) => void
  // 场景配置管理
  exportConfiguration: () => SceneExportPayload
  importConfiguration: (payload: SceneExportPayload) => Promise<{ ok: boolean; missingModels?: string[] }>
  createNewScene: (theme: SceneThemeType, options: { name: string; description: string; defaultPrompt: string; icon?: string }) => void
  updateSceneMeta: (theme: SceneThemeType, updates: Partial<SceneMeta>) => void
  deleteScene: (theme: SceneThemeType) => boolean
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
  
  // 使用 Map 去重，保证每个 ID 唯一（自定义点位优先）
  const pointMap = new Map<string, ScenePointData>()
  filtered.forEach((p) => pointMap.set(p.id, p))
  customPoints.forEach((p) => pointMap.set(p.id, p))
  
  const merged = Array.from(pointMap.values())
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
    groundBounds: null,
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
    const mergedMeta = mergeSceneMeta(overrides.meta, overrides.custom)
    
    set({
      isTransitioning: true,
      showSceneSelector: false,
      sceneMeta: mergedMeta,
      availableScenes: computeAvailableScenes(mergedMeta, overrides.custom),
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
    
    // 更新场景meta的items列表
    const allPoints = initializeScenePoints(theme, overrides)
    if (overrides.meta[theme]) {
      overrides.meta[theme].items = allPoints.map(p => p.name)
    }
    
    saveOverrides(overrides)
    // 更新全局meta状态
    set({ sceneMeta: overrides.meta })
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
    
    // 更新场景meta的items列表
    const allPoints = initializeScenePoints(theme, overrides)
    if (overrides.meta[theme]) {
      overrides.meta[theme].items = allPoints.map(p => p.name)
    }
    
    saveOverrides(overrides)
    // 更新全局meta状态
    set({ sceneMeta: overrides.meta })
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
  setGroundBounds: (bounds) => set({ groundBounds: bounds }),

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

      const normalizedCustom: Record<SceneThemeType, ScenePointData[]> = {}
      Object.entries(payload.custom).forEach(([theme, list]) => {
        normalizedCustom[theme] = list.map(p => normalizePoint(p))
      })

      saveOverrides({
        custom: normalizedCustom,
        deleted: payload.deleted,
        meta: payload.meta,
      })

      const theme = payload.currentTheme || 'museum'
      const mergedMeta = mergeSceneMeta(payload.meta, normalizedCustom)
      
      set({
        currentTheme: theme,
        scenePoints: initializeScenePoints(theme),
        currentPoint: null,
        selectedPointId: null,
        sceneMeta: mergedMeta,
        availableScenes: computeAvailableScenes(mergedMeta, normalizedCustom),
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
      items: [], // 初始为空，点位列表将动态生成
      defaultPrompt: options.defaultPrompt,
    }
    saveOverrides(overrides)

    // 使用 mergeSceneMeta 确保所有场景（包括默认场景）的 meta 都被包含
    const mergedMeta = mergeSceneMeta(overrides.meta, overrides.custom)

    set({
      currentTheme: theme,
      scenePoints: initializeScenePoints(theme, overrides),
      currentPoint: null,
      selectedPointId: null,
      showSceneSelector: false,
      sceneMeta: mergedMeta,
      availableScenes: computeAvailableScenes(mergedMeta, overrides.custom),
    })
  },

  updateSceneMeta: (theme, updates) => {
    const overrides = loadOverrides()

    // 更新场景元数据
    overrides.meta[theme] = {
      ...overrides.meta[theme],
      id: theme,
      name: updates.name || overrides.meta[theme]?.name || theme,
      description: updates.description || overrides.meta[theme]?.description || '',
      icon: updates.icon !== undefined ? updates.icon : (overrides.meta[theme]?.icon || '🎭'),
      items: updates.items || overrides.meta[theme]?.items,
      defaultPrompt: updates.defaultPrompt !== undefined ? updates.defaultPrompt : overrides.meta[theme]?.defaultPrompt,
    }

    saveOverrides(overrides)

    // 更新状态
    const mergedMeta = mergeSceneMeta(overrides.meta, overrides.custom)
    set({
      sceneMeta: mergedMeta,
      availableScenes: computeAvailableScenes(mergedMeta, overrides.custom),
    })
  },

  deleteScene: (theme) => {
    // 检查是否为内置默认场景（不能删除）
    if (theme in defaultSceneMeta) {
      console.warn(`无法删除内置场景: ${theme}`)
      return false
    }
    
    const overrides = loadOverrides()
    
    // 检查场景是否存在
    const hasCustomData = theme in overrides.custom
    const hasMeta = theme in overrides.meta
    
    if (!hasCustomData && !hasMeta) {
      console.warn(`场景不存在: ${theme}`)
      return false
    }
    
    // 删除场景相关数据
    delete overrides.custom[theme]
    delete overrides.deleted[theme]
    delete overrides.meta[theme]
    
    // 如果 sceneDataMap 中有该场景（用户自定义的），也删除
    if (sceneDataMap[theme]) {
      delete sceneDataMap[theme]
    }
    
    saveOverrides(overrides)
    
    // 更新状态
    const mergedMeta = mergeSceneMeta(overrides.meta, overrides.custom)
    const newAvailableScenes = computeAvailableScenes(mergedMeta, overrides.custom)
    
    // 如果当前在被删除的场景中，切换到默认场景
    const currentTheme = get().currentTheme
    if (currentTheme === theme) {
      set({
        isTransitioning: true,
        sceneMeta: mergedMeta,
        availableScenes: newAvailableScenes,
      })
      
      setTimeout(() => {
        set({
          currentTheme: 'museum',
          scenePoints: initializeScenePoints('museum', overrides),
          currentPoint: null,
          selectedPointId: null,
          messages: [],
          playerPosition: new Vector3(0, 1.6, 10),
          isPointerLocked: false,
        })
      }, 100)
      
      setTimeout(() => {
        set({ isTransitioning: false })
      }, 1500)
    } else {
      // 只更新元数据
      set({
        sceneMeta: mergedMeta,
        availableScenes: newAvailableScenes,
      })
    }
    
    return true
  },
  }
})
