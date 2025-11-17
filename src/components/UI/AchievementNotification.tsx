// 成就解锁通知组件

import { useEffect, useState } from 'react'
import { Achievement } from '../../services/progressService'
import { soundGenerator } from '../../services/audioService'
import './AchievementNotification.css'

export default function AchievementNotification() {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleAchievement = (event: CustomEvent) => {
      const achievement = event.detail as Achievement
      setCurrentAchievement(achievement)
      setIsVisible(true)

      // 播放成就音效
      soundGenerator.playSuccess()

      // 3秒后隐藏
      setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => {
          setCurrentAchievement(null)
        }, 300)
      }, 3000)
    }

    window.addEventListener('achievementUnlocked', handleAchievement as EventListener)

    return () => {
      window.removeEventListener('achievementUnlocked', handleAchievement as EventListener)
    }
  }, [])

  if (!currentAchievement) return null

  const rarityColors = {
    common: '#95a5a6',
    rare: '#3498db',
    epic: '#9b59b6',
    legendary: '#f39c12',
  }

  return (
    <div className={`achievement-notification ${isVisible ? 'visible' : ''}`}>
      <div className="achievement-content">
        <div className="achievement-icon">{currentAchievement.icon}</div>
        <div className="achievement-info">
          <div className="achievement-title">成就解锁！</div>
          <div className="achievement-name">{currentAchievement.name}</div>
          <div className="achievement-desc">{currentAchievement.description}</div>
        </div>
        <div
          className="achievement-points"
          style={{ backgroundColor: rarityColors[currentAchievement.rarity] }}
        >
          +{currentAchievement.points}
        </div>
      </div>
      <div className="achievement-glow"></div>
    </div>
  )
}
