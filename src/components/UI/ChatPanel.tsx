// 聊天面板组件

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useStore } from '../../store/useStore'
import { getAIResponse, buildSystemPrompt } from '../../services/aiService'
import { speakText, stopSpeaking } from '../../services/ttsService'
import ModelViewer from './ModelViewer'
import './ChatPanel.css'

export default function ChatPanel() {
  const [input, setInput] = useState('')
  const messages = useStore((state) => state.messages)
  const isAILoading = useStore((state) => state.isAILoading)
  const currentPoint = useStore((state) => state.currentPoint)
  const currentTheme = useStore((state) => state.currentTheme)
  const sceneMeta = useStore((state) => state.sceneMeta)
  const addMessage = useStore((state) => state.addMessage)
  const setAILoading = useStore((state) => state.setAILoading)
  const setShowChat = useStore((state) => state.setShowChat)
  const clearMessages = useStore((state) => state.clearMessages)

  // 面板放大状态
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat-panel-expanded')
      return saved === 'true'
    }
    return false
  })

  // 拖拽相关状态
  const [position, setPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat-panel-position')
      if (saved) return JSON.parse(saved)
    }
    return { top: 80, right: 20 } // 默认位置
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 保存位置到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat-panel-position', JSON.stringify(position))
    }
  }, [position])

  // 保存展开状态到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat-panel-expanded', isExpanded.toString())
    }
  }, [isExpanded])

  // 切换展开状态
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  // 拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('chat-header')) {
      setIsDragging(true)
      const rect = panelRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }
  }

  // 拖拽中
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault()
        setPosition({
          top: Math.max(0, e.clientY - dragOffset.y),
          right: Math.max(0, window.innerWidth - e.clientX - dragOffset.x),
        })
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, dragOffset])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isAILoading) return
    
    const userMessage = input.trim()
    setInput('')
    
    // 添加用户消息
    addMessage({
      role: 'user',
      content: userMessage,
    })
    
    // 调用AI
    setAILoading(true)
    try {
      // 获取当前场景主题
      const currentTheme = useStore.getState().currentTheme

      // 获取当前场景元数据（包含自定义提示词）
      const currentSceneMeta = useStore.getState().sceneMeta[currentTheme]

      // 构建系统提示词（传入场景上下文、主题和元数据）
      const systemPrompt = buildSystemPrompt(
        currentPoint?.aiContext,
        currentTheme,
        currentSceneMeta ? { defaultPrompt: currentSceneMeta.defaultPrompt } : undefined
      )
      
      // 构建对话历史（保留最近10条）
      const chatMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.slice(-10).map(m => ({ 
          role: m.role,
          content: m.content,
        })),
        { role: 'user' as const, content: userMessage },
      ]
      
      const response = await getAIResponse(chatMessages)
      
      addMessage({
        role: 'assistant',
        content: response,
      })
    } catch (error) {
      console.error('AI响应失败:', error)
      addMessage({
        role: 'assistant',
        content: '抱歉，我遇到了一些问题，请稍后再试。',
      })
    } finally {
      setAILoading(false)
      inputRef.current?.focus()
    }
  }
  
  // 快捷问题
  const quickQuestions = [
    '这件文物有什么特殊之处？',
    '它是如何制作的？',
    '它在古代有什么用途？',
    '背后有什么历史故事吗？',
  ]
  
  const handleQuickQuestion = (question: string) => {
    setInput(question)
    inputRef.current?.focus()
  }

  // 播报消息
  const handleSpeakMessage = (messageId: string, text: string) => {
    if (speakingMessageId === messageId) {
      // 如果正在播报此消息，则停止播报
      stopSpeaking()
      setSpeakingMessageId(null)
    } else {
      // 播报新消息
      stopSpeaking() // 先停止当前播报
      setSpeakingMessageId(messageId)

      speakText({
        text: text,
        onStart: () => {
          setSpeakingMessageId(messageId)
        },
        onEnd: () => {
          setSpeakingMessageId(null)
        },
        onError: () => {
          setSpeakingMessageId(null)
        },
      })
    }
  }
  
  return (
    <div
      ref={panelRef}
      className={`chat-panel ${isDragging ? 'dragging' : ''} ${isExpanded ? 'expanded' : ''}`}
      style={{
        '--chat-top': `${position.top}px`,
        '--chat-right': `${position.right}px`,
        '--chat-z-index': isDragging ? '9999' : '1000',
      } as React.CSSProperties}
      onMouseDown={handleMouseDown}
    >
      {/* 头部 */}
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">🤖</span>
          <span>AI 文化导览</span>
          {currentPoint && (
            <span className="current-scene">· {currentPoint.name}</span>
          )}
        </div>
        <div className="chat-actions">
          <button
            className="expand-button"
            onClick={toggleExpanded}
            title={isExpanded ? '收起' : '展开'}
          >
            {isExpanded ? '🔽' : '🔼'}
          </button>
          {messages.length > 0 && (
            <button
              className="clear-button"
              onClick={clearMessages}
              title="清空对话"
            >
              🗑️
            </button>
          )}
          <button
            className="close-button"
            onClick={() => setShowChat(false)}
            title="关闭"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="chat-content">
        {/* 聊天区域 */}
        <div className="chat-section">
          {/* 消息列表 */}
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <p>👋 您好！我是您的AI文化导览员。</p>
                <p>您可以向我提问任何关于文物的问题。</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
              >
                <div className="message-avatar">
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {message.role === 'assistant' ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {/* 播报按钮 - 仅对AI消息显示 */}
                  {message.role === 'assistant' && (
                    <button
                      className={`speak-button ${speakingMessageId === message.id ? 'speaking' : ''}`}
                      onClick={() => handleSpeakMessage(message.id, message.content)}
                      title={speakingMessageId === message.id ? '停止播报' : '播报此消息'}
                    >
                      {speakingMessageId === message.id ? '⏹️' : '🔊'}
                      <span className="speak-button-text">
                        {speakingMessageId === message.id ? '停止' : '播报'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
        
            {isAILoading && (
              <div className="message ai-message">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 快捷问题 */}
          {messages.length === 0 && (
            <div className="quick-questions">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  className="quick-question-btn"
                  onClick={() => handleQuickQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {/* 输入区域 */}
          <div className="chat-input-container">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="输入您的问题..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isAILoading}
            />
            <button
              className="send-button"
              onClick={handleSend}
              disabled={!input.trim() || isAILoading}
            >
              {isAILoading ? '⏳' : '发送'}
            </button>
          </div>
        </div>

        {/* 模型预览区域 - 仅在展开时显示 */}
        {isExpanded && (
          <div className="model-preview-section">
            <div className="model-preview-header">
              <span className="model-preview-title">📦 3D 模型预览</span>
              {currentPoint?.modelPath && (
                <span className="model-info-hint">
                  使用鼠标拖拽旋转，滚轮缩放
                </span>
              )}
            </div>
            <ModelViewer
              modelPath={currentPoint?.modelPath}
              name={currentPoint?.name}
              className="chat-model-viewer"
            />
          </div>
        )}
      </div>
    </div>
  )
}
