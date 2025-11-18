import { useState, useEffect } from 'react'
import { TTSConfig, getAvailableVoices } from '../../services/ttsService'
import './TTSConfigPanel.css'

interface TTSProvider {
  id: string
  name: string
  description: string
  isFree: boolean
  baseURL?: string
  requiresApiKey: boolean
  voices?: string[]
}

const providers: TTSProvider[] = [
  {
    id: 'browser',
    name: '浏览器原生',
    description: 'Web Speech API - 免费使用，无需配置',
    isFree: true,
    requiresApiKey: false,
    voices: undefined, // 动态加载
  },
  {
    id: 'ollama',
    name: 'Ollama TTS',
    description: '本地大模型TTS - 免费，需要安装Ollama',
    isFree: true,
    baseURL: 'http://localhost:11434',
    requiresApiKey: false,
    voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
  },
  {
    id: 'azure',
    name: 'Azure 认知服务',
    description: '微软Azure语音服务 - 付费，音质优秀',
    isFree: false,
    requiresApiKey: true,
    voices: ['zh-CN-XiaoxiaoNeural', 'zh-CN-YunxiNeural', 'zh-CN-YunjianNeural'],
  },
  {
    id: 'baidu',
    name: '百度语音合成',
    description: '百度开放平台 - 付费，对中文优化',
    isFree: false,
    requiresApiKey: true,
    voices: ['female-shaonv', 'male-qiaowei', 'female-yujie'],
  },
  {
    id: 'iflytek',
    name: '科大讯飞',
    description: '科大讯飞开放平台 - 付费，识别准确',
    isFree: false,
    requiresApiKey: true,
    voices: ['xiaoyi', 'xiaoming', 'xiaoyi'],
  },
  {
    id: 'openai',
    name: 'OpenAI TTS',
    description: 'OpenAI语音合成 - 付费，音质极佳',
    isFree: false,
    baseURL: 'https://api.openai.com/v1',
    requiresApiKey: true,
    voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
  },
  {
    id: 'custom',
    name: '自定义 API',
    description: '自定义OpenAI兼容API',
    isFree: false,
    baseURL: '',
    requiresApiKey: true,
  },
]

export default function TTSConfigPanel({ onClose }: { onClose: () => void }) {
  const [config, setConfig] = useState<TTSConfig>({
    provider: 'browser',
    voice: 'zh-CN-XiaoxiaoNeural',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isLoadingVoices, setIsLoadingVoices] = useState(false)

  useEffect(() => {
    // 从localStorage读取TTS配置
    const savedConfig = localStorage.getItem('tts-config')
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }
  }, [])

  const handleLoadBrowserVoices = async () => {
    setIsLoadingVoices(true)
    try {
      // 等待语音列表加载
      const loadVoices = () => {
        const voices = getAvailableVoices()
        setBrowserVoices(voices)
        if (voices.length > 0 && !config.voice) {
          // 如果没有选择语音，默认选择第一个中文语音或第一个可用语音
          const chineseVoice = voices.find(v => v.lang.includes('zh'))
          setConfig(prev => ({
            ...prev,
            voice: chineseVoice?.name || voices[0].name
          }))
        }
      }

      // 尝试立即获取
      loadVoices()

      // 如果语音列表为空，等待voiceschanged事件
      if (browserVoices.length === 0) {
        if ('speechSynthesis' in window) {
          speechSynthesis.onvoiceschanged = loadVoices
        }
      }
    } catch (error) {
      console.error('获取语音列表失败:', error)
      alert('获取浏览器语音列表失败，请检查浏览器支持')
    } finally {
      setIsLoadingVoices(false)
    }
  }

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId)
    if (!provider) return

    setConfig({
      ...config,
      provider: providerId as TTSConfig['provider'],
      baseURL: provider.baseURL,
      voice: provider.voices?.[0] || '',
    })
  }

  const handleSave = () => {
    localStorage.setItem('tts-config', JSON.stringify(config))
    alert('TTS配置已保存！')
    onClose()
  }

  const selectedProvider = providers.find(p => p.id === config.provider)

  return (
    <div className="tts-config-overlay">
      <div className="tts-config-panel">
        <div className="tts-config-header">
          <h2>🔊 TTS配置</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="tts-config-content">
          {/* 提供商选择 */}
          <div className="config-section">
            <label className="config-label">选择提供商</label>
            <div className="provider-grid">
              {providers.map(provider => (
                <div
                  key={provider.id}
                  className={`provider-card ${config.provider === provider.id ? 'active' : ''}`}
                  onClick={() => handleProviderChange(provider.id)}
                >
                  <div className="provider-name">
                    {provider.name}
                    {provider.isFree && <span className="free-badge">免费</span>}
                  </div>
                  <div className="provider-desc">{provider.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Base URL */}
          <div className="config-section">
            <label className="config-label">Base URL</label>
            <input
              type="text"
              className="config-input"
              value={config.baseURL || ''}
              onChange={(e) => setConfig({ ...config, baseURL: e.target.value })}
              placeholder="API基础地址"
              disabled={selectedProvider?.id === 'browser'}
            />
          </div>

          {/* API Key */}
          {selectedProvider?.requiresApiKey && (
            <div className="config-section">
              <label className="config-label">API Key</label>
              <div className="api-key-input">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="config-input"
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="输入API密钥"
                />
                <button
                  className="show-password-button"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          {/* 语音选择 */}
          <div className="config-section">
            <label className="config-label">
              语音
              {selectedProvider?.id === 'browser' && (
                <button
                  className="load-voices-button"
                  onClick={handleLoadBrowserVoices}
                  disabled={isLoadingVoices}
                  style={{ marginLeft: '10px', fontSize: '12px', padding: '4px 8px' }}
                >
                  {isLoadingVoices ? '加载中...' : '🔄 获取浏览器语音'}
                </button>
              )}
            </label>

            {/* 浏览器语音提供商 */}
            {selectedProvider?.id === 'browser' ? (
              <>
                {browserVoices.length > 0 ? (
                  <select
                    className="config-select"
                    value={config.voice || ''}
                    onChange={(e) => setConfig({ ...config, voice: e.target.value })}
                  >
                    {browserVoices.map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang}) {voice.default ? '✓' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="voices-not-loaded">
                    <p style={{ color: '#999', fontSize: '13px', margin: '8px 0' }}>
                      💡 点击"获取浏览器语音"按钮加载可用语音列表
                    </p>
                  </div>
                )}

                {browserVoices.length > 0 && (
                  <input
                    type="text"
                    className="config-input"
                    style={{ marginTop: '8px' }}
                    value={config.voice || ''}
                    onChange={(e) => setConfig({ ...config, voice: e.target.value })}
                    placeholder="或手动输入自定义语音名称"
                  />
                )}
              </>
            ) : (
              /* 其他提供商 */
              <>
                <select
                  className="config-select"
                  value={config.voice || ''}
                  onChange={(e) => setConfig({ ...config, voice: e.target.value })}
                >
                  {selectedProvider?.voices?.map(voice => (
                    <option key={voice} value={voice}>{voice}</option>
                  ))}
                  {!selectedProvider?.voices && (
                    <option value="">默认</option>
                  )}
                </select>
                <input
                  type="text"
                  className="config-input"
                  style={{ marginTop: '8px' }}
                  value={config.voice || ''}
                  onChange={(e) => setConfig({ ...config, voice: e.target.value })}
                  placeholder="或输入自定义语音名称"
                />
              </>
            )}
          </div>

          {/* 语音参数 */}
          <div className="config-section">
            <label className="config-label">语音参数</label>
            <div className="param-group">
              <div className="param-item">
                <label>语速 (0.5-2.0)</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.rate || 1.0}
                  onChange={(e) => setConfig({ ...config, rate: parseFloat(e.target.value) })}
                />
                <span className="param-value">{(config.rate || 1.0).toFixed(1)}</span>
              </div>
              <div className="param-item">
                <label>音调 (0.5-2.0)</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.pitch || 1.0}
                  onChange={(e) => setConfig({ ...config, pitch: parseFloat(e.target.value) })}
                />
                <span className="param-value">{(config.pitch || 1.0).toFixed(1)}</span>
              </div>
              <div className="param-item">
                <label>音量 (0.0-1.0)</label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={config.volume || 1.0}
                  onChange={(e) => setConfig({ ...config, volume: parseFloat(e.target.value) })}
                />
                <span className="param-value">{(config.volume || 1.0).toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tts-config-footer">
          <button className="save-button" onClick={handleSave}>
            保存配置
          </button>
        </div>
      </div>
    </div>
  )
}
