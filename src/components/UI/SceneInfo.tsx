// 场景信息组件
import { useStore } from '../../store/useStore'
import './SceneInfo.css'

export default function SceneInfo() {
  const currentPoint = useStore((state) => state.currentPoint)
  const scenePoints = useStore((state) => state.scenePoints)
  
  if (!currentPoint) return null
  
  const visitedCount = scenePoints.filter(p => p.visited).length
  const totalCount = scenePoints.length
  
  return (
    <div className="scene-info fade-in">
      <div className="scene-badge">
        {currentPoint.visited ? '✓' : '新'}
      </div>
      
      <div className="scene-content">
        <h3 className="scene-name">{currentPoint.name}</h3>
        <p className="scene-description">{currentPoint.description}</p>
        
        <div className="scene-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(visitedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            已探索 {visitedCount}/{totalCount}
          </span>
        </div>
      </div>
    </div>
  )
}
