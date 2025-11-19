import { useState, useEffect, useRef } from 'react'
import { timeOfDayService, TimeOfDay } from '../../services/timeOfDayService'
import './TimeOfDayControl.css'

export default function TimeOfDayControl() {
  const [currentTime, setCurrentTime] = useState<TimeOfDay>('day')
  const [isCycling, setIsCycling] = useState(false)
  const [isAutoMode, setIsAutoMode] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [position, setPosition] = useState({ x: 320, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hasDragged, setHasDragged] = useState(false)
  const controlRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 恢复保存的设置
    timeOfDayService.restoreFromStorage()
    setCurrentTime(timeOfDayService.getCurrentTime())

    // 读取保存的位置
    const savedPosition = localStorage.getItem('time-of-day-control-position')
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition))
    }

    // 订阅时间变化
    const unsubscribe = timeOfDayService.subscribe((time: TimeOfDay) => {
      setCurrentTime(time)
      timeOfDayService.saveToStorage()
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    // 保存位置到localStorage
    localStorage.setItem('time-of-day-control-position', JSON.stringify(position))
  }, [position])

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

  const times = timeOfDayService.getAllTimes()

  return (
    <div
      ref={controlRef}
      className={`time-of-day-control ${!isExpanded ? 'collapsed' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed',
        zIndex: isDragging ? 9999 : 1001,
      }}
    >
      {!isExpanded ? (
        <button
          className="tod-toggle"
          onMouseDown={handleMouseDown}
          onClick={handleToggleClick}
          title="展开昼夜模式面板"
        >
          🌍
        </button>
      ) : (
        <div
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
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
        </div>
      )}
    </div>
  )
}
