// 加载屏幕组件
import './LoadingScreen.css'

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        
        <h2 className="loading-title">加载中...</h2>
        <p className="loading-text">正在准备您的文化之旅</p>
        
        <div className="loading-progress">
          <div className="loading-bar">
            <div className="loading-fill"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
