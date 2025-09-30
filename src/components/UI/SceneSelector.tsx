import { useStore } from '../../store/useStore'
import type { SceneThemeType } from '../../store/useStore'
import './SceneSelector.css'

const sceneInfo = {
  museum: {
    name: '博物馆',
    icon: '🏺',
    description: '探索中国传统文物，了解悠久历史',
    items: ['商代青铜鼎', '唐代丝绸画卷', '战国玉璧'],
  },
  redMansion: {
    name: '红楼梦',
    icon: '🏮',
    description: '走进大观园，体验红楼梦的诗意世界',
    items: ['大观园正门', '怡红院', '潇湘馆'],
  },
  silkRoad: {
    name: '丝绸之路',
    icon: '🐫',
    description: '穿越古丝绸之路，见证东西文化交流',
    items: ['长安城', '敦煌莫高窟', '撒马尔罕'],
  },
}

export default function SceneSelector() {
  const showSceneSelector = useStore((state) => state.showSceneSelector)
  const currentTheme = useStore((state) => state.currentTheme)
  const switchScene = useStore((state) => state.switchScene)
  const setShowSceneSelector = useStore((state) => state.setShowSceneSelector)
  
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
          {Object.entries(sceneInfo).map(([key, info]) => {
            const theme = key as SceneThemeType
            const isActive = currentTheme === theme
            
            return (
              <div
                key={key}
                className={`scene-card ${isActive ? 'active' : ''}`}
                onClick={() => handleSceneClick(theme)}
              >
                <div className="scene-icon">{info.icon}</div>
                <h3 className="scene-name">{info.name}</h3>
                <p className="scene-description">{info.description}</p>
                
                <div className="scene-items">
                  <h4>包含场景：</h4>
                  <ul>
                    {info.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                
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
