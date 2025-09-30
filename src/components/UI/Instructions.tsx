import { useStore } from '../../store/useStore'
import './Instructions.css'

export default function Instructions() {
  const setShowInstructions = useStore((state) => state.setShowInstructions)
  
  return (
    <div className="instructions-overlay fade-in">
      <div className="instructions-panel slide-up">
        <h2>🎮 操作说明</h2>
        
        <div className="instructions-content">
          <div className="instruction-section">
            <h3>🚶 移动控制</h3>
            <ul>
              <li><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> 或 方向键 - 移动</li>
              <li><kbd>Space</kbd> - 跳跃</li>
              <li><kbd>鼠标</kbd> - 环顾四周</li>
              <li><kbd>ESC</kbd> - 解除鼠标锁定</li>
            </ul>
          </div>
          
          <div className="instruction-section">
            <h3>🏺 体验指南</h3>
            <ul>
              <li>走近文物会自动触发 AI 讲解</li>
              <li>可以随时向 AI 提问关于文物的问题</li>
              <li>绿色标记表示已访问的文物</li>
              <li>金色光晕表示当前激活的文物</li>
            </ul>
          </div>
          
          <div className="instruction-section">
            <h3>💡 提示</h3>
            <ul>
              <li>建议佩戴耳机以获得最佳体验</li>
              <li>探索场景中的三件文物</li>
              <li>尝试从不同角度观察文物</li>
            </ul>
          </div>
        </div>
        
        <button
          className="start-button"
          onClick={() => setShowInstructions(false)}
        >
          开始探索 →
        </button>
        
        <p className="hint">点击屏幕任意位置开始第一人称视角</p>
      </div>
    </div>
  )
}
