// 音频控制组件
import { useState, useEffect } from 'react'
import { audioService, soundGenerator } from '../../services/audioService'
import './AudioControls.css'

export default function AudioControls() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [config, setConfig] = useState(audioService.getConfig())

  useEffect(() => {
    // 定期更新配置（防止外部修改）
    const interval = setInterval(() => {
      setConfig({ ...audioService.getConfig() })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleVolumeChange = (type: string, value: number) => {
    switch (type) {
      case 'master':
        audioService.setMasterVolume(value)
        break
      case 'music':
        audioService.setMusicVolume(value)
        break
      case 'sfx':
        audioService.setSFXVolume(value)
        break
      case 'ambient':
        audioService.setAmbientVolume(value)
        break
    }
    setConfig({ ...audioService.getConfig() })
  }

  const handleToggleMute = () => {
    audioService.toggleMute()
    setConfig({ ...audioService.getConfig() })
  }

  const handleTestSFX = () => {
    soundGenerator.playClick()
  }

  return (
    <div className={`audio-controls ${isExpanded ? 'expanded' : ''}`}>
      {!isExpanded ? (
        <button
          className="audio-toggle"
          onClick={() => setIsExpanded(true)}
          title="音频设置"
        >
          {config.isMuted ? (
            <span className="audio-icon">🔇</span>
          ) : (
            <span className="audio-icon">🔊</span>
          )}
        </button>
      ) : (
        <div className="audio-panel">
          <div className="audio-header">
            <h3>🎵 音频设置</h3>
            <button
              className="close-button"
              onClick={() => setIsExpanded(false)}
            >
              ×
            </button>
          </div>

          <div className="audio-content">
            {/* 主音量 */}
            <div className="volume-control">
              <label className="volume-label">
                <span>🔊 主音量</span>
                <span className="volume-value">{Math.round(config.masterVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.masterVolume}
                onChange={(e) => handleVolumeChange('master', parseFloat(e.target.value))}
                className="volume-slider"
              />
            </div>

            {/* 音乐音量 */}
            <div className="volume-control">
              <label className="volume-label">
                <span>🎶 背景音乐</span>
                <span className="volume-value">{Math.round(config.musicVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.musicVolume}
                onChange={(e) => handleVolumeChange('music', parseFloat(e.target.value))}
                className="volume-slider"
              />
            </div>

            {/* 音效音量 */}
            <div className="volume-control">
              <label className="volume-label">
                <span>⚡ 音效</span>
                <span className="volume-value">{Math.round(config.sfxVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.sfxVolume}
                onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
                className="volume-slider"
              />
            </div>

            {/* 环境音音量 */}
            <div className="volume-control">
              <label className="volume-label">
                <span>🌊 环境音</span>
                <span className="volume-value">{Math.round(config.ambientVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.ambientVolume}
                onChange={(e) => handleVolumeChange('ambient', parseFloat(e.target.value))}
                className="volume-slider"
              />
            </div>

            {/* 操作按钮 */}
            <div className="audio-actions">
              <button
                className="audio-button"
                onClick={handleToggleMute}
              >
                {config.isMuted ? '🔇 取消静音' : '🔊 静音'}
              </button>
              <button
                className="audio-button secondary"
                onClick={handleTestSFX}
              >
                🔔 测试音效
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
