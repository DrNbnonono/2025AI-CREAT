import { useStore } from '../../store/useStore'
import './Instructions.css'

export default function Instructions() {
  const setShowInstructions = useStore((state) => state.setShowInstructions)

  return (
    <div className="instructions-overlay">
      {/* 背景动画粒子 */}
      <div className="floating-particles">
        <span style={{ '--i': 1 } as React.CSSProperties}></span>
        <span style={{ '--i': 2 } as React.CSSProperties}></span>
        <span style={{ '--i': 3 } as React.CSSProperties}></span>
        <span style={{ '--i': 4 } as React.CSSProperties}></span>
        <span style={{ '--i': 5 } as React.CSSProperties}></span>
        <span style={{ '--i': 6 } as React.CSSProperties}></span>
        <span style={{ '--i': 7 } as React.CSSProperties}></span>
        <span style={{ '--i': 8 } as React.CSSProperties}></span>
        <span style={{ '--i': 9 } as React.CSSProperties}></span>
        <span style={{ '--i': 10 } as React.CSSProperties}></span>
      </div>

      <div className="instructions-panel">
        {/* 主标题区域 */}
        <div className="instructions-header">
          <div className="title-decoration">
            <div className="decoration-line"></div>
            <div className="decoration-icon">🏛️</div>
            <div className="decoration-line"></div>
          </div>
          <h1 className="instructions-title">
            <span className="title-main">AI+中国优秀传统文化</span>
            <span className="title-sub">沉浸式文化遗产探索体验</span>
          </h1>
          <p className="instructions-welcome">
            欢迎来到数字文化殿堂，在这里，历史与科技完美融合
          </p>
        </div>

        {/* 主要内容区域 */}
        <div className="instructions-content">
          {/* 移动控制卡片 */}
          <div className="instruction-card">
            <div className="card-header">
              <div className="card-icon">🎮</div>
              <h3>移动控制</h3>
            </div>
            <div className="card-content">
              <div className="control-group">
                <div className="control-item">
                  <kbd className="key">W</kbd>
                  <kbd className="key">A</kbd>
                  <kbd className="key">S</kbd>
                  <kbd className="key">D</kbd>
                  <span className="control-desc">或方向键 - 自由移动</span>
                </div>
                <div className="control-item">
                  <kbd className="key space">Space</kbd>
                  <span className="control-desc">跳跃探索</span>
                </div>
                <div className="control-item">
                  <span className="mouse-icon">🖱️</span>
                  <span className="control-desc">鼠标 - 360°环顾</span>
                </div>
                <div className="control-item">
                  <kbd className="key esc">ESC</kbd>
                  <span className="control-desc">退出视角锁定</span>
                </div>
              </div>
            </div>
          </div>

          {/* 体验指南卡片 */}
          <div className="instruction-card featured">
            <div className="card-header">
              <div className="card-icon">🏺</div>
              <h3>体验指南</h3>
            </div>
            <div className="card-content">
              <ul className="feature-list">
                <li>
                  <span className="feature-icon">✨</span>
                  <span>靠近文物自动触发AI讲解与语音朗诵</span>
                </li>
                <li>
                  <span className="feature-icon">💬</span>
                  <span>与AI对话，深度了解文物背后的故事</span>
                </li>
                <li>
                  <span className="feature-icon">🎯</span>
                  <span>绿色标记 = 已探索 | 金色光晕 = 当前热点</span>
                </li>
                <li>
                  <span className="feature-icon">🔊</span>
                  <span>开启语音导览，享受沉浸式文化之旅</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 探索提示卡片 */}
          <div className="instruction-card">
            <div className="card-header">
              <div className="card-icon">💡</div>
              <h3>探索提示</h3>
            </div>
            <div className="card-content">
              <div className="tips-grid">
                <div className="tip-item">
                  <div className="tip-icon">🎧</div>
                  <p>佩戴耳机获得<br />最佳体验</p>
                </div>
                <div className="tip-item">
                  <div className="tip-icon">🔍</div>
                  <p>仔细探索场景中<br />的珍贵文物</p>
                </div>
                <div className="tip-item">
                  <div className="tip-icon">👀</div>
                  <p>多角度观察<br />发现更多细节</p>
                </div>
                <div className="tip-item">
                  <div className="tip-icon">🤖</div>
                  <p>AI助手随时为您<br />答疑解惑</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部行动区 */}
        <div className="instructions-footer">
          <button
            className="start-button"
            onClick={() => setShowInstructions(false)}
          >
            <span className="button-text">开始探索之旅</span>
            <span className="button-arrow">→</span>
          </button>
          <p className="start-hint">
            <span className="hint-icon">💫</span>
            点击屏幕任意位置进入第一人称视角
          </p>
        </div>
      </div>
    </div>
  )
}
