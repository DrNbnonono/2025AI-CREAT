import { useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { speakText, stopSpeaking, isTTSSupported } from '../../services/ttsService'
import './TTSControls.css'

export default function TTSControls() {
  const currentPoint = useStore((state) => state.currentPoint)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    // 从localStorage读取TTS设置
    const saved = localStorage.getItem('tts-settings')
    if (saved) {
      const settings = JSON.parse(saved)
      setIsEnabled(settings.enabled ?? false)
      setVoiceEnabled(settings.voiceEnabled ?? false)
    }
  }, [])

  useEffect(() => {
    // 保存设置到localStorage
    localStorage.setItem('tts-settings', JSON.stringify({
      enabled: isEnabled,
      voiceEnabled,
    }))
  }, [isEnabled, voiceEnabled])

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
    <div className="tts-controls">
      {!isExpanded ? (
        <button
          className="tts-toggle"
          onClick={() => setIsExpanded(true)}
          title="展开语音导览面板"
        >
          <span className="tts-toggle-icon">🔊</span>
        </button>
      ) : (
        <div className="tts-panel">
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
