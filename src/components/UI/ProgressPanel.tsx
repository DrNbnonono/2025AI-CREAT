// 进度面板组件
import { useState, useEffect } from 'react'
import { progressService, UserProgress } from '../../services/progressService'
import './ProgressPanel.css'

export default function ProgressPanel({ onClose }: { onClose: () => void }) {
  const [progress, setProgress] = useState<UserProgress>(progressService.getProgress())
  const [achievements, setAchievements] = useState(
    progressService.getAllAchievements()
  )

  useEffect(() => {
    const unsubscribe = progressService.subscribe((p) => {
      setProgress({ ...p })
      setAchievements(progressService.getAllAchievements())
    })

    return unsubscribe
  }, [])

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}小时${minutes}分钟`
  }

  const progressPercentage = progressService.getProgressPercentage()
  const totalPoints = progressService.getTotalPoints()

  return (
    <div className="progress-overlay" onClick={onClose}>
      <div className="progress-panel" onClick={(e) => e.stopPropagation()}>
        <div className="progress-header">
          <h2>📊 我的进度</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="progress-content">
          {/* 总体进度 */}
          <div className="progress-overview">
            <div className="progress-circle">
              <svg viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`}
                  transform="rotate(-90 50 50)"
                  className="progress-bar"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="progress-text">
                <div className="progress-percent">{Math.round(progressPercentage)}%</div>
                <div className="progress-label">完成度</div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">🏺</div>
                <div className="stat-value">{progress.visitedPoints.length}</div>
                <div className="stat-label">文物访问</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">💬</div>
                <div className="stat-value">{progress.conversationsCount}</div>
                <div className="stat-label">对话次数</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">{totalPoints}</div>
                <div className="stat-label">成就分数</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">⏱️</div>
                <div className="stat-value">
                  {formatDuration(progress.totalVisitTime)}
                </div>
                <div className="stat-label">访问时长</div>
              </div>
            </div>
          </div>

          {/* 成就列表 */}
          <div className="achievements-section">
            <h3>🏆 成就 ({achievements.filter(a => a.unlockedAt).length}/{achievements.length})</h3>
            <div className="achievements-grid">
              {achievements.map((achievement) => {
                const isUnlocked = !!achievement.unlockedAt
                const rarityColors = {
                  common: '#95a5a6',
                  rare: '#3498db',
                  epic: '#9b59b6',
                  legendary: '#f39c12',
                }

                return (
                  <div
                    key={achievement.id}
                    className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div
                      className="achievement-card-icon"
                      style={{
                        backgroundColor: isUnlocked ? rarityColors[achievement.rarity] : '#e0e0e0',
                      }}
                    >
                      {achievement.icon}
                    </div>
                    <div className="achievement-card-info">
                      <div className="achievement-card-name">{achievement.name}</div>
                      <div className="achievement-card-desc">{achievement.description}</div>
                      <div className="achievement-card-points">
                        {isUnlocked ? `+${achievement.points}分` : '未解锁'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 探索历史 */}
          <div className="exploration-section">
            <h3>🗺️ 探索历史</h3>
            <div className="exploration-stats">
              <div className="exploration-item">
                <span className="exploration-label">首次访问:</span>
                <span className="exploration-value">
                  {new Date(progress.firstVisit).toLocaleDateString()}
                </span>
              </div>
              <div className="exploration-item">
                <span className="exploration-label">最近访问:</span>
                <span className="exploration-value">
                  {new Date(progress.lastVisit).toLocaleDateString()}
                </span>
              </div>
              <div className="exploration-item">
                <span className="exploration-label">探索场景:</span>
                <span className="exploration-value">
                  {progress.completedScenes.length}个
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
