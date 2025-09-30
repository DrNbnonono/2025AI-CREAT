import { useEffect, useState } from 'react'
import './SceneTransition.css'

interface SceneTransitionProps {
  isTransitioning: boolean
  sceneName: string
}

export default function SceneTransition({ isTransitioning, sceneName }: SceneTransitionProps) {
  const [show, setShow] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  
  useEffect(() => {
    if (isTransitioning) {
      setShow(true)
      setFadeOut(false)
      
      // 1.5秒后开始淡出
      const timer = setTimeout(() => {
        setFadeOut(true)
      }, 1500)
      
      return () => {
        clearTimeout(timer)
      }
    } else {
      // 立即隐藏，不要等待动画
      setShow(false)
      setFadeOut(false)
    }
  }, [isTransitioning])
  
  if (!show) return null
  
  return (
    <div className={`scene-transition ${fadeOut ? 'fade-out' : ''}`}>
      <div className="transition-content">
        <div className="transition-icon">🎭</div>
        <h2 className="transition-title">正在进入</h2>
        <p className="transition-scene">{sceneName}</p>
        <div className="transition-loader">
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
        </div>
      </div>
    </div>
  )
}
