// 昼夜切换系统
// 控制场景光照、天空盒、环境氛围

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'

export interface TimeOfDayConfig {
  time: TimeOfDay
  label: string
  icon: string
  duration: number // 过渡持续时间（秒）
  lighting: {
    ambientIntensity: number
    directionalIntensity: number
    color: string
    shadowOpacity: number
  }
  fog: {
    color: string
    near: number
    far: number
  }
  background: {
    color: string
    gradient?: string[]
  }
}

const timeConfigs: Record<TimeOfDay, TimeOfDayConfig> = {
  dawn: {
    time: 'dawn',
    label: '黎明',
    icon: '🌅',
    duration: 3,
    lighting: {
      ambientIntensity: 0.4,
      directionalIntensity: 0.8,
      color: '#ff9966',
      shadowOpacity: 0.6,
    },
    fog: {
      color: '#ffb088',
      near: 10,
      far: 100,
    },
    background: {
      color: '#ff9966',
      gradient: ['#ff9966', '#ff5e62'],
    },
  },
  day: {
    time: 'day',
    label: '白天',
    icon: '☀️',
    duration: 0,
    lighting: {
      ambientIntensity: 0.6,
      directionalIntensity: 1.2,
      color: '#ffffff',
      shadowOpacity: 0.4,
    },
    fog: {
      color: '#87ceeb',
      near: 20,
      far: 150,
    },
    background: {
      color: '#87ceeb',
      gradient: ['#87ceeb', '#b0e0e6'],
    },
  },
  dusk: {
    time: 'dusk',
    label: '黄昏',
    icon: '🌇',
    duration: 3,
    lighting: {
      ambientIntensity: 0.3,
      directionalIntensity: 0.6,
      color: '#ff6b6b',
      shadowOpacity: 0.7,
    },
    fog: {
      color: '#ff8787',
      near: 15,
      far: 120,
    },
    background: {
      color: '#ff6b6b',
      gradient: ['#ff6b6b', '#4a4e69'],
    },
  },
  night: {
    time: 'night',
    label: '夜晚',
    icon: '🌙',
    duration: 3,
    lighting: {
      ambientIntensity: 0.2,
      directionalIntensity: 0.3,
      color: '#4a4e69',
      shadowOpacity: 0.8,
    },
    fog: {
      color: '#2d3561',
      near: 5,
      far: 80,
    },
    background: {
      color: '#0a0e27',
      gradient: ['#0a0e27', '#1a1a2e'],
    },
  },
}

class TimeOfDayService {
  private currentTime: TimeOfDay = 'day'
  private listeners: ((time: TimeOfDay) => void)[] = []
  private animationId: number | null = null

  /**
   * 获取当前时间
   */
  getCurrentTime(): TimeOfDay {
    return this.currentTime
  }

  /**
   * 设置时间（立即切换）
   */
  setTime(time: TimeOfDay): void {
    if (time === this.currentTime) return

    this.currentTime = time
    console.log(`🌍 切换到: ${timeConfigs[time].label}`)
    this.notifyListeners(time)
  }

  /**
   * 切换到下一个时间
   */
  nextTime(): TimeOfDay {
    const order: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night']
    const currentIndex = order.indexOf(this.currentTime)
    const nextIndex = (currentIndex + 1) % order.length
    const nextTime = order[nextIndex]

    this.setTime(nextTime)
    return nextTime
  }

  /**
   * 循环切换时间（自动播放）
   */
  startCycle(interval: number = 30000): void {
    this.stopCycle()
    this.nextTime()
    this.animationId = window.setInterval(() => {
      this.nextTime()
    }, interval)
    console.log(`⏰ 昼夜循环已启动，间隔: ${interval / 1000}秒`)
  }

  /**
   * 停止循环
   */
  stopCycle(): void {
    if (this.animationId) {
      clearInterval(this.animationId)
      this.animationId = null
      console.log('⏸️ 昼夜循环已停止')
    }
  }

  /**
   * 获取时间配置
   */
  getConfig(time?: TimeOfDay): TimeOfDayConfig {
    return timeConfigs[time || this.currentTime]
  }

  /**
   * 获取所有可用时间
   */
  getAllTimes(): TimeOfDay[] {
    return ['dawn', 'day', 'dusk', 'night']
  }

  /**
   * 订阅时间变化
   */
  subscribe(listener: (time: TimeOfDay) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  /**
   * 通知所有订阅者
   */
  private notifyListeners(time: TimeOfDay): void {
    this.listeners.forEach((listener) => listener(time))
  }

  /**
   * 保存到 localStorage
   */
  saveToStorage(): void {
    localStorage.setItem('timeOfDay', JSON.stringify({
      currentTime: this.currentTime,
    }))
  }

  /**
   * 从 localStorage 恢复
   */
  restoreFromStorage(): void {
    const saved = localStorage.getItem('timeOfDay')
    if (saved) {
      try {
        const { currentTime } = JSON.parse(saved)
        if (currentTime && timeConfigs[currentTime]) {
          this.currentTime = currentTime
        }
      } catch (e) {
        console.warn('恢复时间设置失败:', e)
      }
    }
  }

  /**
   * 混合两个时间配置（用于平滑过渡）
   */
  blendConfigs(config1: TimeOfDayConfig, config2: TimeOfDayConfig, progress: number): Partial<TimeOfDayConfig> {
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

    return {
      lighting: {
        ambientIntensity: config1.lighting.ambientIntensity +
          (config2.lighting.ambientIntensity - config1.lighting.ambientIntensity) * progress,
        directionalIntensity: config1.lighting.directionalIntensity +
          (config2.lighting.directionalIntensity - config1.lighting.directionalIntensity) * progress,
        color: progress < 0.5 ? config1.lighting.color : config2.lighting.color,
        shadowOpacity: clamp(
          config1.lighting.shadowOpacity +
          (config2.lighting.shadowOpacity - config1.lighting.shadowOpacity) * progress,
          0,
          1
        ),
      },
      fog: {
        color: progress < 0.5 ? config1.fog.color : config2.fog.color,
        near: config1.fog.near + (config2.fog.near - config1.fog.near) * progress,
        far: config1.fog.far + (config2.fog.far - config1.fog.far) * progress,
      },
      background: {
        color: progress < 0.5 ? config1.background.color : config2.background.color,
      },
    }
  }
}

// 单例实例
export const timeOfDayService = new TimeOfDayService()
