import { useStore } from '../../store/useStore'
import type { SceneThemeType } from '../../store/useStore'
import './SceneSelector.css'

export default function SceneSelector() {
  const showSceneSelector = useStore((state) => state.showSceneSelector)
  const currentTheme = useStore((state) => state.currentTheme)
  const switchScene = useStore((state) => state.switchScene)
  const setShowSceneSelector = useStore((state) => state.setShowSceneSelector)
  const sceneMeta = useStore((state) => state.sceneMeta)
  const availableScenes = useStore((state) => state.availableScenes)
  
  if (!showSceneSelector) return null
  
  const handleSceneClick = (theme: SceneThemeType) => {
    if (theme !== currentTheme) {
      switchScene(theme)
    } else {
      setShowSceneSelector(false)
    }
  }
  
  return (
    <div className="scene-selector-overlay fade-in">
      <div className="scene-selector-panel slide-up">
        <div className="scene-selector-header">
          <h2>🎭 选择场景</h2>
          <button
            className="close-btn"
            onClick={() => setShowSceneSelector(false)}
          >
            ✕
          </button>
        </div>
        
        <div className="scene-cards">
          {availableScenes.map((theme) => {
            const meta = sceneMeta[theme]
            if (!meta) return null
            const isActive = currentTheme === theme
            
            return (
              <div
                key={theme}
                className={`scene-card ${isActive ? 'active' : ''}`}
                onClick={() => handleSceneClick(theme)}
              >
                <div className="scene-icon">{meta.icon || '🎭'}</div>
                <h3 className="scene-name">{meta.name}</h3>
                <p className="scene-description">{meta.description}</p>
                
                {meta.items && meta.items.length > 0 && (
                  <div className="scene-items">
                    <h4>包含场景：</h4>
                    <ul>
                      {meta.items.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {isActive && (
                  <div className="active-badge">当前场景</div>
                )}
                
                <button className="scene-enter-btn">
                  {isActive ? '继续探索' : '进入场景'}
                </button>
              </div>
            )
          })}
        </div>
        
        <p className="scene-selector-hint">
          💡 提示：切换场景会重置当前进度
        </p>
      </div>
    </div>
  )
}
