import { create } from 'zustand'
import { Vector3 } from 'three'
import { sceneDataMap } from '../data/sceneData'
import type { ScenePointData } from '../data/sceneData'

// 场景点位配置
export interface ScenePoint extends ScenePointData {
  visited: boolean
  rotation?: Vector3
  scale?: number
}

// 场景主题类型
export type SceneThemeType = 'museum' | 'redMansion' | 'silkRoad'

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
}

// 初始化场景点位
// 覆盖数据结构（本地持久化）
type Overrides = {
  custom: Record<SceneThemeType, ScenePointData[]>
  deleted: Record<SceneThemeType, string[]>
}

const STORAGE_KEY = 'scene-overrides-v1'

function loadOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { custom: { museum: [], redMansion: [], silkRoad: [] }, deleted: { museum: [], redMansion: [], silkRoad: [] } }
    }
    const parsed = JSON.parse(raw)
    return {
      custom: { museum: [], redMansion: [], silkRoad: [], ...(parsed.custom || {}) },
      deleted: { museum: [], redMansion: [], silkRoad: [], ...(parsed.deleted || {}) },
    }
  } catch {
    return { custom: { museum: [], redMansion: [], silkRoad: [] }, deleted: { museum: [], redMansion: [], silkRoad: [] } }
  }
}

function saveOverrides(data: Overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function initializeScenePoints(theme: SceneThemeType): ScenePoint[] {
  const base = sceneDataMap[theme]
  const overrides = loadOverrides()
  const deletedIds = new Set(overrides.deleted[theme] || [])
  const filtered = base.filter(p => !deletedIds.has(p.id))
  const merged: ScenePointData[] = [...filtered, ...(overrides.custom[theme] || [])]
  return merged.map(point => ({ ...point, visited: false }))
}

export const useStore = create<GameState>((set, get) => ({
  // 初始状态
  playerPosition: new Vector3(0, 1.6, 10),
  isPointerLocked: false,
  
  // 场景管理
  currentTheme: 'museum' as SceneThemeType,
  scenePoints: initializeScenePoints('museum'),
  showSceneSelector: false,
  isTransitioning: false,
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
    // 开始过场动画
    set({ isTransitioning: true, showSceneSelector: false })
    
    // 立即切换场景数据和重置位置
    setTimeout(() => {
      set({
        currentTheme: theme,
        scenePoints: initializeScenePoints(theme),
        currentPoint: null,
        messages: [],
        playerPosition: new Vector3(0, 1.6, 10),
        // 确保强制重置位置
        isPointerLocked: false,
        // 重置跳跃可用状态（通过一个无副作用的标记即可，逻辑在控制器中基于高度重置）
      })
    }, 100)
    
    // 1.5秒后结束过场动画（确保不会阻塞UI）
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
}))
