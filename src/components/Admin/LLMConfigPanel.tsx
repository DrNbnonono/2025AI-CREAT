import { useState, useEffect } from 'react'
import './LLMConfigPanel.css'

interface LLMProvider {
  id: string
  name: string
  description: string
  baseURL: string
  requiresApiKey: boolean
  defaultModel?: string
  models?: string[]
}

const providers: LLMProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5-turbo',
    baseURL: 'https://api.openai.com/v1',
    requiresApiKey: true,
    defaultModel: 'gpt-3.5-turbo',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    id: 'ollama',
    name: 'Ollama (本地)',
    description: '本地大语言模型',
    baseURL: 'http://localhost:11434/v1',
    requiresApiKey: false,
    defaultModel: 'qwen2.5:7b',
    models: ['qwen2.5:7b', 'llama3.1:8b', 'mistral:7b', 'gemma2:9b'],
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    description: '本地OpenAI兼容API',
    baseURL: 'http://localhost:1234/v1',
    requiresApiKey: false,
    defaultModel: 'local-model',
  },
  {
    id: 'tongyi',
    name: '通义千问',
    description: '阿里云通义千问',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    requiresApiKey: true,
    defaultModel: 'qwen-turbo',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    description: 'SiliconFlow API',
    baseURL: 'https://api.siliconflow.cn/v1',
    requiresApiKey: true,
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder', 'qwen-turbo', 'glm-4'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek API',
    baseURL: 'https://api.deepseek.com/v1',
    requiresApiKey: true,
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder'],
  },
  {
    id: 'wenxin',
    name: '文心一言',
    description: '百度文心一言',
    baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat',
    requiresApiKey: true,
    defaultModel: 'ernie-bot-turbo',
    models: ['ernie-bot-turbo', 'ernie-bot', 'ernie-bot-pro'],
  },
  {
    id: 'zhipu',
    name: '智谱清言',
    description: '智谱AI GLM系列',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    requiresApiKey: true,
    defaultModel: 'glm-4-flash',
    models: ['glm-4', 'glm-4-flash', 'glm-4-plus'],
  },
  {
    id: 'custom',
    name: '自定义',
    description: '自定义OpenAI兼容API',
    baseURL: '',
    requiresApiKey: true,
  },
]

interface LLMConfig {
  provider: string
  baseURL: string
  apiKey: string
  model: string
}

export default function LLMConfigPanel({ onClose }: { onClose: () => void }) {
  const [config, setConfig] = useState<LLMConfig>({
    provider: 'ollama',
    baseURL: '',
    apiKey: '',
    model: '',
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  useEffect(() => {
    // 从环境变量读取初始配置
    const savedConfig = localStorage.getItem('llm-config')
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    } else {
      // 使用默认配置
      const defaultProvider = providers.find(p => p.id === 'ollama') || providers[0]
      setConfig({
        provider: defaultProvider.id,
        baseURL: defaultProvider.baseURL,
        apiKey: '',
        model: defaultProvider.defaultModel || '',
      })
    }
  }, [])

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId)
    if (!provider) return

    // 保留当前模型，除非切换到有预设模型的提供商且用户没有自定义输入
    let newModel = config.model
    const hasCustomModel = config.model && !providers.find(p => p.id === config.provider)?.models?.includes(config.model)

    // 如果当前没有自定义模型，且新提供商有默认模型，则使用默认模型
    if (!hasCustomModel && provider.defaultModel) {
      newModel = provider.defaultModel
    }

    setConfig({
      provider: providerId,
      baseURL: provider.baseURL,
      apiKey: '', // 切换提供商时清空API密钥
      model: newModel,
    })
    setTestStatus('idle')
  }

  const handleSave = () => {
    localStorage.setItem('llm-config', JSON.stringify(config))
    alert('配置已保存！')
    onClose()
  }

  const handleTest = async () => {
    setTestStatus('testing')
    setTestMessage('测试连接中...')

    try {
      const response = await fetch(`${config.baseURL}/models`, {
        headers: config.apiKey
          ? { 'Authorization': `Bearer ${config.apiKey}` }
          : {},
      })

      if (response.ok) {
        setTestStatus('success')
        setTestMessage('✅ 连接成功！')
      } else {
        setTestStatus('error')
        setTestMessage(`❌ 连接失败: ${response.statusText}`)
      }
    } catch (error) {
      setTestStatus('error')
      setTestMessage(`❌ 连接错误: ${error}`)
    }
  }

  const selectedProvider = providers.find(p => p.id === config.provider)

  return (
    <div className="llm-config-overlay">
      <div className="llm-config-panel">
        <div className="llm-config-header">
          <h2>🤖 LLM配置</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="llm-config-content">
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
                  <div className="provider-name">{provider.name}</div>
                  <div className="provider-desc">{provider.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 基本配置 */}
          <div className="config-section">
            <label className="config-label">Base URL</label>
            <input
              type="text"
              className="config-input"
              value={config.baseURL}
              onChange={(e) => setConfig({ ...config, baseURL: e.target.value })}
              placeholder="API基础地址"
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
                  value={config.apiKey}
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

          {/* 模型选择 - 所有提供商都支持自定义 */}
          <div className="config-section">
            <label className="config-label">模型</label>
            <div className="model-input-container">
              {selectedProvider?.models && selectedProvider.models.length > 0 && (
                <select
                  className="config-select"
                  value={selectedProvider.models.includes(config.model) ? config.model : ''}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                >
                  <option value="">-- 从预设模型中选择 --</option>
                  {selectedProvider.models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                className="config-input"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                placeholder="输入自定义模型名称"
              />
            </div>
            <div className="input-hint">
              💡 提示：从上方下拉选择预设模型，或直接在文本框中输入自定义模型名称
            </div>
          </div>

          {/* 测试结果 */}
          {testMessage && (
            <div className={`test-result ${testStatus}`}>
              {testMessage}
            </div>
          )}
        </div>

        <div className="llm-config-footer">
          <button
            className="test-button"
            onClick={handleTest}
            disabled={!config.baseURL || testStatus === 'testing'}
          >
            {testStatus === 'testing' ? '测试中...' : '测试连接'}
          </button>
          <button className="save-button" onClick={handleSave}>
            保存配置
          </button>
        </div>
      </div>
    </div>
  )
}
