// Text-to-Speech Service - 支持多种TTS方案
// 1. 浏览器原生Web Speech API
// 2. Ollama本地TTS模型
// 3. 云端TTS API（OpenAI等）

export interface TTSConfig {
  provider: 'browser' | 'ollama' | 'openai' | 'custom'
  baseURL?: string
  apiKey?: string
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
}

export interface TTSOptions {
  text: string
  config?: Partial<TTSConfig>
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: any) => void
}

const defaultConfig: TTSConfig = {
  provider: 'browser',
  voice: 'zh-CN-XiaoxiaoNeural', // 中文语音
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
}

/**
 * 浏览器原生TTS
 */
function speakWithBrowser(text: string, config: TTSConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('浏览器不支持语音合成'))
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = config.rate || 1.0
    utterance.pitch = config.pitch || 1.0
    utterance.volume = config.volume || 1.0

    // 尝试使用指定语音
    const voices = speechSynthesis.getVoices()
    const voice = voices.find(v =>
      v.lang.includes('zh') || v.name.includes(config.voice || '')
    )
    if (voice) {
      utterance.voice = voice
    }

    utterance.onend = () => resolve()
    utterance.onerror = (e) => reject(e.error)

    speechSynthesis.speak(utterance)
  })
}

/**
 * Ollama TTS (如果安装并配置了TTS模型)
 */
async function speakWithOllama(text: string, config: TTSConfig): Promise<void> {
  const baseURL = config.baseURL || 'http://localhost:11434'

  try {
    // 这里是示例代码，Ollama的TTS可能需要不同的端点
    const response = await fetch(`${baseURL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: config.voice || 'default',
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama TTS请求失败: ${response.statusText}`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        resolve()
      }
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl)
        reject(e)
      }
      audio.play()
    })
  } catch (error) {
    throw new Error(`Ollama TTS调用失败: ${error}`)
  }
}

/**
 * OpenAI TTS API
 */
async function speakWithOpenAI(text: string, config: TTSConfig): Promise<void> {
  const baseURL = config.baseURL || 'https://api.openai.com/v1'
  const apiKey = config.apiKey

  if (!apiKey) {
    throw new Error('OpenAI API Key未配置')
  }

  try {
    const response = await fetch(`${baseURL}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: config.voice || 'alloy',
        response_format: 'mp3',
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI TTS请求失败: ${response.statusText}`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        resolve()
      }
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl)
        reject(e)
      }
      audio.play()
    })
  } catch (error) {
    throw new Error(`OpenAI TTS调用失败: ${error}`)
  }
}

/**
 * 主函数：文本转语音
 */
export async function speakText(options: TTSOptions): Promise<void> {
  const config = { ...defaultConfig, ...options.config }
  const { text, onStart, onEnd, onError } = options

  try {
    onStart?.()

    switch (config.provider) {
      case 'browser':
        await speakWithBrowser(text, config)
        break

      case 'ollama':
        await speakWithOllama(text, config)
        break

      case 'openai':
        await speakWithOpenAI(text, config)
        break

      default:
        // 降级到浏览器原生TTS
        await speakWithBrowser(text, config)
    }

    onEnd?.()
  } catch (error) {
    console.error('TTS错误:', error)
    onError?.(error)
    // 降级方案：浏览器TTS
    try {
      await speakWithBrowser(text, config)
      onEnd?.()
    } catch (fallbackError) {
      onError?.(fallbackError)
    }
  }
}

/**
 * 停止当前播放
 */
export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
}

/**
 * 获取可用语音列表（浏览器TTS）
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if ('speechSynthesis' in window) {
    return speechSynthesis.getVoices()
  }
  return []
}

/**
 * 获取可用语音列表（仅中文和英文）
 */
export function getAvailableVoicesZhEn(): SpeechSynthesisVoice[] {
  if ('speechSynthesis' in window) {
    return speechSynthesis.getVoices().filter(v =>
      v.lang.includes('zh') || v.lang.includes('en') || v.lang.includes('cmn')
    )
  }
  return []
}

/**
 * 检查TTS支持
 */
export function isTTSSupported(): boolean {
  return 'speechSynthesis' in window
}
