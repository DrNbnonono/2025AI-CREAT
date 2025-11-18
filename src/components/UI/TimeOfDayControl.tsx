import { useState, useEffect } from 'react'
import { timeOfDayService, TimeOfDay } from '../../services/timeOfDayService'
import './TimeOfDayControl.css'

export default function TimeOfDayControl() {
  const [currentTime, setCurrentTime] = useState<TimeOfDay>('day')
  const [isCycling, setIsCycling] = useState(false)
  const [isAutoMode, setIsAutoMode] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    // 恢复保存的设置
    timeOfDayService.restoreFromStorage()
    setCurrentTime(timeOfDayService.getCurrentTime())

    // 订阅时间变化
    const unsubscribe = timeOfDayService.subscribe((time: TimeOfDay) => {
      setCurrentTime(time)
      timeOfDayService.saveToStorage()
    })

    return unsubscribe
  }, [])

  const handleTimeChange = (time: TimeOfDay) => {
    timeOfDayService.setTime(time)
    setIsCycling(false)
    setIsAutoMode(false)
  }

  const handleCycle = () => {
    if (isCycling) {
      timeOfDayService.stopCycle()
      setIsCycling(false)
    } else {
      timeOfDayService.startCycle(20000) // 20秒切换一次
      setIsCycling(true)
    }
  }

  const handleAutoToggle = () => {
    setIsAutoMode(!isAutoMode)
    if (!isAutoMode) {
      timeOfDayService.startCycle(30000)
    } else {
      timeOfDayService.stopCycle()
    }
  }

  const times = timeOfDayService.getAllTimes()

  return (
    <div className={`time-of-day-control ${!isExpanded ? 'collapsed' : ''}`}>
      {!isExpanded ? (
        <button
          className="tod-toggle"
          onClick={() => setIsExpanded(true)}
          title="展开昼夜模式面板"
        >
          🌍
        </button>
      ) : (
        <>
          <div className="tod-header">
            <span className="tod-icon">🌍</span>
            <span className="tod-title">昼夜模式</span>
            {isAutoMode && <span className="auto-badge">自动</span>}
            <button
              className="tod-collapse-button"
              onClick={() => setIsExpanded(false)}
              title="收起"
            >
              ✕
            </button>
          </div>

      <div className="tod-times">
        {times.map((time) => {
          const config = timeOfDayService.getConfig(time)
          const isActive = currentTime === time
          return (
            <button
              key={time}
              className={`tod-button ${isActive ? 'active' : ''}`}
              onClick={() => handleTimeChange(time)}
              title={config.label}
            >
              <span className="tod-button-icon">{config.icon}</span>
              <span className="tod-button-label">{config.label}</span>
            </button>
          )
        })}
      </div>

      <div className="tod-actions">
        <button
          className={`tod-action-button ${isCycling ? 'cycling' : ''}`}
          onClick={handleCycle}
        >
          {isCycling ? '⏸️ 停止' : '🔄 循环'}
        </button>
        <button
          className={`tod-action-button secondary ${isAutoMode ? 'active' : ''}`}
          onClick={handleAutoToggle}
        >
          {isAutoMode ? '🤖 自动 ✓' : '🤖 自动'}
        </button>
      </div>

          <div className="tod-current">
            <span className="current-label">当前:</span>
            <span className="current-value">
              {timeOfDayService.getConfig(currentTime).icon}
              {timeOfDayService.getConfig(currentTime).label}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
