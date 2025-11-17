// 用户进度追踪与成就系统
// 记录探索进度、解锁成就、收集数据

export interface UserProgress {
  visitedPoints: string[]
  completedScenes: string[]
  totalVisitTime: number // 总访问时间（秒）
  conversationsCount: number // 对话次数
  achievementsUnlocked: string[]
  firstVisit: string
  lastVisit: string
  stats: {
    totalArtifactsViewed: number
    totalQuestionsAsked: number
    scenesExplored: Set<string>
    favoriteScene?: string
    avgSessionDuration: number
  }
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  condition: (progress: UserProgress) => boolean
  points: number
  unlockedAt?: string
}

const achievements: Achievement[] = [
  {
    id: 'first-step',
    name: '初探者',
    description: '访问你的第一个文物',
    icon: '👣',
    rarity: 'common',
    condition: (progress) => progress.visitedPoints.length >= 1,
    points: 10,
  },
  {
    id: 'culture-lover',
    name: '文化爱好者',
    description: '访问5个文物',
    icon: '❤️',
    rarity: 'common',
    condition: (progress) => progress.visitedPoints.length >= 5,
    points: 25,
  },
  {
    id: 'explorer',
    name: '探索者',
    description: '访问10个文物',
    icon: '🧭',
    rarity: 'rare',
    condition: (progress) => progress.visitedPoints.length >= 10,
    points: 50,
  },
  {
    id: 'museum-master',
    name: '博物馆大师',
    description: '访问所有文物',
    icon: '🏆',
    rarity: 'epic',
    condition: (progress) => progress.visitedPoints.length >= 15,
    points: 100,
  },
  {
    id: 'curious-mind',
    name: '好奇宝宝',
    description: '提出你的第一个问题',
    icon: '🤔',
    rarity: 'common',
    condition: (progress) => progress.conversationsCount >= 1,
    points: 15,
  },
  {
    id: 'scholar',
    name: '学者',
    description: '提出10个问题',
    icon: '📚',
    rarity: 'rare',
    condition: (progress) => progress.conversationsCount >= 10,
    points: 75,
  },
  {
    id: 'scene-collector',
    name: '场景收集者',
    description: '探索所有场景',
    icon: '🎭',
    rarity: 'rare',
    condition: (progress) => progress.completedScenes.length >= 3,
    points: 60,
  },
  {
    id: 'time-traveller',
    name: '时空旅行者',
    description: '体验所有昼夜模式',
    icon: '⏰',
    rarity: 'rare',
    condition: (progress) => progress.stats.totalArtifactsViewed >= 8,
    points: 80,
  },
  {
    id: 'dedicated-visitor',
    name: '忠实访客',
    description: '累计访问30分钟',
    icon: '⏱️',
    rarity: 'rare',
    condition: (progress) => progress.totalVisitTime >= 1800,
    points: 100,
  },
  {
    id: 'legend',
    name: '文化传播者',
    description: '解锁所有成就',
    icon: '⭐',
    rarity: 'legendary',
    condition: (progress) => progress.achievementsUnlocked.length >= achievements.length,
    points: 500,
  },
]

class ProgressService {
  private progress: UserProgress
  private sessionStart: number = Date.now()
  private listeners: ((progress: UserProgress) => void)[] = []

  constructor() {
    this.progress = this.loadProgress()
    this.sessionStart = Date.now()
  }

  /**
   * 加载进度
   */
  private loadProgress(): UserProgress {
    const saved = localStorage.getItem('user-progress')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        // 转换 Set
        data.stats = {
          ...data.stats,
          scenesExplored: new Set(data.stats.scenesExplored || []),
        }
        return data
      } catch (e) {
        console.warn('加载进度失败:', e)
      }
    }

    // 默认进度
    return {
      visitedPoints: [],
      completedScenes: [],
      totalVisitTime: 0,
      conversationsCount: 0,
      achievementsUnlocked: [],
      firstVisit: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
      stats: {
        totalArtifactsViewed: 0,
        totalQuestionsAsked: 0,
        scenesExplored: new Set(),
        avgSessionDuration: 0,
      },
    }
  }

  /**
   * 保存进度
   */
  private saveProgress(): void {
    try {
      const dataToSave = {
        ...this.progress,
        stats: {
          ...this.progress.stats,
          scenesExplored: Array.from(this.progress.stats.scenesExplored),
        },
      }
      localStorage.setItem('user-progress', JSON.stringify(dataToSave))
    } catch (e) {
      console.error('保存进度失败:', e)
    }
  }

  /**
   * 访问文物
   */
  visitPoint(pointId: string): void {
    if (!this.progress.visitedPoints.includes(pointId)) {
      this.progress.visitedPoints.push(pointId)
      this.progress.stats.totalArtifactsViewed += 1

      // 检查成就
      this.checkAchievements()

      this.notifyListeners()
      this.saveProgress()

      console.log(`✅ 访问文物: ${pointId}`)
    }
  }

  /**
   * 提问
   */
  askQuestion(): void {
    this.progress.conversationsCount += 1
    this.progress.stats.totalQuestionsAsked += 1

    this.checkAchievements()
    this.notifyListeners()
    this.saveProgress()
  }

  /**
   * 切换场景
   */
  switchScene(sceneId: string): void {
    if (!this.progress.completedScenes.includes(sceneId)) {
      this.progress.completedScenes.push(sceneId)
    }

    this.progress.stats.scenesExplored.add(sceneId)
    this.progress.lastVisit = new Date().toISOString()

    // 计算平均会话时长
    const sessionDuration = (Date.now() - this.sessionStart) / 1000
    this.progress.totalVisitTime += sessionDuration
    this.progress.stats.avgSessionDuration =
      (this.progress.stats.avgSessionDuration + sessionDuration) / 2
    this.sessionStart = Date.now()

    this.checkAchievements()
    this.notifyListeners()
    this.saveProgress()
  }

  /**
   * 检查成就
   */
  private checkAchievements(): void {
    achievements.forEach((achievement) => {
      if (
        !this.progress.achievementsUnlocked.includes(achievement.id) &&
        achievement.condition(this.progress)
      ) {
        this.progress.achievementsUnlocked.push(achievement.id)

        console.log(`🎉 解锁成就: ${achievement.name} ${achievement.icon}`)
        this.notifyAchievement(achievement)
      }
    })
  }

  /**
   * 通知成就解锁
   */
  private notifyAchievement(achievement: Achievement): void {
    // 可以在这里添加通知逻辑
    const event = new CustomEvent('achievementUnlocked', {
      detail: achievement,
    })
    window.dispatchEvent(event)
  }

  /**
   * 获取进度
   */
  getProgress(): UserProgress {
    return { ...this.progress }
  }

  /**
   * 获取已解锁成就
   */
  getUnlockedAchievements(): Achievement[] {
    return this.progress.achievementsUnlocked
      .map((id) => achievements.find((a) => a.id === id))
      .filter((a): a is Achievement => a !== undefined)
  }

  /**
   * 获取所有成就
   */
  getAllAchievements(): Achievement[] {
    return achievements.map((a) => ({
      ...a,
      unlockedAt: this.progress.achievementsUnlocked.includes(a.id)
        ? new Date().toISOString()
        : undefined,
    }))
  }

  /**
   * 获取进度百分比
   */
  getProgressPercentage(): number {
    return Math.min(100, (this.progress.visitedPoints.length / 10) * 100)
  }

  /**
   * 获取成就分数
   */
  getTotalPoints(): number {
    return this.getUnlockedAchievements().reduce(
      (sum, a) => sum + a.points,
      0
    )
  }

  /**
   * 重置进度
   */
  resetProgress(): void {
    this.progress = {
      visitedPoints: [],
      completedScenes: [],
      totalVisitTime: 0,
      conversationsCount: 0,
      achievementsUnlocked: [],
      firstVisit: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
      stats: {
        totalArtifactsViewed: 0,
        totalQuestionsAsked: 0,
        scenesExplored: new Set(),
        avgSessionDuration: 0,
      },
    }
    this.saveProgress()
    this.notifyListeners()
    console.log('🔄 进度已重置')
  }

  /**
   * 导出进度数据
   */
  exportProgress(): string {
    const exportData = {
      progress: this.progress,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    }
    return JSON.stringify(exportData, null, 2)
  }

  /**
   * 订阅进度变化
   */
  subscribe(listener: (progress: UserProgress) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  /**
   * 通知所有订阅者
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.progress))
  }
}

// 单例实例
export const progressService = new ProgressService()
