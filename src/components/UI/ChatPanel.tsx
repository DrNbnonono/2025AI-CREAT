// 聊天面板组件

import { useState, useRef, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { getAIResponse, buildSystemPrompt } from '../../services/aiService'
import './ChatPanel.css'

export default function ChatPanel() {
  const [input, setInput] = useState('')
  const messages = useStore((state) => state.messages)
  const isAILoading = useStore((state) => state.isAILoading)
  const currentPoint = useStore((state) => state.currentPoint)
  const addMessage = useStore((state) => state.addMessage)
  const setAILoading = useStore((state) => state.setAILoading)
  const setShowChat = useStore((state) => state.setShowChat)
  const clearMessages = useStore((state) => state.clearMessages)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
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
      
      // 构建系统提示词（传入场景上下文和主题）
      const systemPrompt = buildSystemPrompt(currentPoint?.aiContext, currentTheme)
      
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
  
  return (
    <div className="chat-panel fade-in">
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
              <div className="message-text">{message.content}</div>
              <div className="message-time">
                {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
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
  )
}
