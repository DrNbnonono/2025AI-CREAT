import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { speakText, stopSpeaking, isTTSSupported } from '../../services/ttsService'
import './TTSControls.css'

export default function TTSControls() {
  const currentPoint = useStore((state) => state.currentPoint)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hasDragged, setHasDragged] = useState(false)
  const controlRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 从localStorage读取TTS设置和位置
    const saved = localStorage.getItem('tts-settings')
    if (saved) {
      const settings = JSON.parse(saved)
      setIsEnabled(settings.enabled ?? false)
      setVoiceEnabled(settings.voiceEnabled ?? false)
    }

    // 读取保存的位置
    const savedPosition = localStorage.getItem('tts-control-position')
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition))
    }
  }, [])

  useEffect(() => {
    // 保存位置到localStorage
    localStorage.setItem('tts-control-position', JSON.stringify(position))
  }, [position])

  useEffect(() => {
    // 保存设置到localStorage
    localStorage.setItem('tts-settings', JSON.stringify({
      enabled: isEnabled,
      voiceEnabled,
    }))
  }, [isEnabled, voiceEnabled])

  // 拖动功能
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!controlRef.current) return
    const rect = controlRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
    setHasDragged(false)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    const deltaX = Math.abs(e.clientX - (position.x + dragOffset.x))
    const deltaY = Math.abs(e.clientY - (position.y + dragOffset.y))
    // 如果移动超过3像素，认为是拖动
    if (deltaX > 3 || deltaY > 3) {
      setHasDragged(true)
    }
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleToggleClick = (e: React.MouseEvent) => {
    // 如果是拖动，不触发展开
    if (hasDragged) {
      e.stopPropagation()
      setHasDragged(false)
      return
    }
    setIsExpanded(true)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  useEffect(() => {
    // 当进入新的触发点时，自动播放讲解
    if (isEnabled && voiceEnabled && currentPoint && !isSpeaking) {
      const content = `欢迎来到${currentPoint.name}。${currentPoint.aiContext}`
      speakText({
        text: content,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      })
    }
  }, [currentPoint, isEnabled, voiceEnabled, isSpeaking])

  const handleToggleTTS = () => {
    if (isSpeaking) {
      stopSpeaking()
      setIsSpeaking(false)
    } else {
      setIsEnabled(!isEnabled)
    }
  }

  const handlePlayCurrent = () => {
    if (currentPoint && isEnabled) {
      const content = `这是${currentPoint.name}。${currentPoint.aiContext}`
      speakText({
        text: content,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      })
    }
  }

  if (!isTTSSupported()) {
    return null
  }

  return (
    <div
      ref={controlRef}
      className="tts-controls"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed',
        zIndex: isDragging ? 9999 : 1000,
      }}
    >
      {!isExpanded ? (
        <button
          className="tts-toggle"
          onMouseDown={handleMouseDown}
          onClick={handleToggleClick}
          title="展开语音导览面板"
        >
          <span className="tts-toggle-icon">🔊</span>
        </button>
      ) : (
        <div
          className="tts-panel"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="tts-header">
            <span className="tts-icon">🔊</span>
            <span className="tts-title">语音导览</span>
            <button
              className="tts-collapse-button"
              onClick={() => setIsExpanded(false)}
              title="收起"
            >
              ✕
            </button>
          </div>

        <div className="tts-options">
          <label className="tts-option">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
            />
            <span>启用语音讲解</span>
          </label>

          <label className="tts-option">
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
              disabled={!isEnabled}
            />
            <span>自动播放讲解</span>
          </label>
        </div>

        <div className="tts-actions">
          <button
            className={`tts-button ${isSpeaking ? 'speaking' : ''}`}
            onClick={handleToggleTTS}
            disabled={!isEnabled}
          >
            {isSpeaking ? '⏹️ 停止' : '▶️ 播放'}
          </button>

          <button
            className="tts-button secondary"
            onClick={handlePlayCurrent}
            disabled={!isEnabled || !currentPoint || isSpeaking}
          >
            🔄 重新播放
          </button>
        </div>

          {currentPoint && (
            <div className="tts-current">
              <span className="tts-current-label">当前讲解:</span>
              <span className="tts-current-name">{currentPoint.name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
