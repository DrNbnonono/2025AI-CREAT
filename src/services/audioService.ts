// 音效管理系统
// 支持背景音乐、环境音效、交互音效

export interface AudioConfig {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  ambientVolume: number
  isMuted: boolean
}

const defaultConfig: AudioConfig = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  ambientVolume: 0.3,
  isMuted: false,
}

class AudioService {
  private audioContext: AudioContext | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private ambientGain: GainNode | null = null
  private masterGain: GainNode | null = null
  private currentMusic: HTMLAudioElement | null = null
  private config: AudioConfig = { ...defaultConfig }
  private initialized = false

  /**
   * 初始化音频系统
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // 创建增益节点
      this.masterGain = this.audioContext.createGain()
      this.musicGain = this.audioContext.createGain()
      this.sfxGain = this.audioContext.createGain()
      this.ambientGain = this.audioContext.createGain()

      // 连接音频图
      this.musicGain.connect(this.masterGain)
      this.sfxGain.connect(this.masterGain)
      this.ambientGain.connect(this.masterGain)
      this.masterGain.connect(this.audioContext.destination)

      // 加载配置
      this.loadConfig()
      this.updateVolumes()

      this.initialized = true
      console.log('✅ 音频系统初始化成功')
    } catch (error) {
      console.error('❌ 音频系统初始化失败:', error)
    }
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    const saved = localStorage.getItem('audio-config')
    if (saved) {
      try {
        this.config = { ...defaultConfig, ...JSON.parse(saved) }
      } catch (e) {
        console.warn('音频配置解析失败，使用默认值')
      }
    }
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    localStorage.setItem('audio-config', JSON.stringify(this.config))
  }

  /**
   * 更新音量
   */
  private updateVolumes(): void {
    if (!this.masterGain || !this.musicGain || !this.sfxGain || !this.ambientGain) return

    const masterVolume = this.config.isMuted ? 0 : this.config.masterVolume
    this.masterGain.gain.value = masterVolume
    this.musicGain.gain.value = this.config.musicVolume
    this.sfxGain.gain.value = this.config.sfxVolume
    this.ambientGain.gain.value = this.config.ambientVolume
  }

  /**
   * 播放背景音乐
   */
  async playMusic(url: string, loop: boolean = true): Promise<void> {
    if (!this.initialized) await this.initialize()

    try {
      // 停止当前音乐
      if (this.currentMusic) {
        this.currentMusic.pause()
        this.currentMusic = null
      }

      this.currentMusic = new Audio(url)
      this.currentMusic.loop = loop
      this.currentMusic.volume = this.config.musicVolume * this.config.masterVolume

      await this.currentMusic.play()
      console.log('🎵 播放背景音乐:', url)
    } catch (error) {
      console.error('播放音乐失败:', error)
    }
  }

  /**
   * 停止背景音乐
   */
  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.pause()
      this.currentMusic = null
    }
  }

  /**
   * 播放音效
   */
  async playSFX(url: string, volume: number = 1.0): Promise<void> {
    if (!this.initialized || this.config.isMuted) return

    try {
      const audio = new Audio(url)
      audio.volume = volume * this.config.sfxVolume * this.config.masterVolume
      await audio.play()
    } catch (error) {
      console.error('播放音效失败:', error)
    }
  }

  /**
   * 播放环境音效
   */
  async playAmbient(url: string, loop: boolean = true): Promise<void> {
    if (!this.initialized) await this.initialize()

    try {
      const audio = new Audio(url)
      audio.loop = loop
      audio.volume = this.config.ambientVolume * this.config.masterVolume
      await audio.play()
      console.log('🌊 播放环境音效:', url)
    } catch (error) {
      console.error('播放环境音效失败:', error)
    }
  }

  /**
   * 设置主音量
   */
  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume))
    this.updateVolumes()
    this.saveConfig()
  }

  /**
   * 设置音乐音量
   */
  setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume))
    this.updateVolumes()
    this.saveConfig()
  }

  /**
   * 设置音效音量
   */
  setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume))
    this.updateVolumes()
    this.saveConfig()
  }

  /**
   * 设置环境音音量
   */
  setAmbientVolume(volume: number): void {
    this.config.ambientVolume = Math.max(0, Math.min(1, volume))
    this.updateVolumes()
    this.saveConfig()
  }

  /**
   * 静音/取消静音
   */
  toggleMute(): boolean {
    this.config.isMuted = !this.config.isMuted
    this.updateVolumes()
    this.saveConfig()
    return this.config.isMuted
  }

  /**
   * 获取配置
   */
  getConfig(): AudioConfig {
    return { ...this.config }
  }

  /**
   * 设置配置
   */
  setConfig(config: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...config }
    this.updateVolumes()
    this.saveConfig()
  }
}

// 单例实例
export const audioService = new AudioService()

// 预设音效（使用Web Audio API生成简单音效）
export class SoundGenerator {
  private audioContext: AudioContext | null = null

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.audioContext
  }

  /**
   * 生成提示音
   */
  async playChime(frequency: number = 800, duration: number = 0.3): Promise<void> {
    const ctx = this.getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.start()
    oscillator.stop(ctx.currentTime + duration)
  }

  /**
   * 生成成功提示音
   */
  async playSuccess(): Promise<void> {
    await this.playChime(600, 0.15)
    setTimeout(() => this.playChime(800, 0.15), 150)
    setTimeout(() => this.playChime(1000, 0.2), 300)
  }

  /**
   * 生成错误提示音
   */
  async playError(): Promise<void> {
    await this.playChime(400, 0.3)
  }

  /**
   * 生成点击音
   */
  async playClick(): Promise<void> {
    await this.playChime(1000, 0.1)
  }
}

export const soundGenerator = new SoundGenerator()
