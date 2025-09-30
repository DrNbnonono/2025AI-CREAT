import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { useAdminStore } from '../../store/useAdminStore'
import AdminLogin from '../Admin/AdminLogin'
import './Controls.css'

export default function Controls() {
  const showChat = useStore((state) => state.showChat)
  const toggleChat = useStore((state) => state.toggleChat)
  const showInstructions = useStore((state) => state.showInstructions)
  const setShowInstructions = useStore((state) => state.setShowInstructions)
  const setShowSceneSelector = useStore((state) => state.setShowSceneSelector)
  
  // 管理员相关
  const userRole = useAdminStore((state) => state.userRole)
  const isEditMode = useAdminStore((state) => state.isEditMode)
  const toggleEditMode = useAdminStore((state) => state.toggleEditMode)
  const logout = useAdminStore((state) => state.logout)
  
  const [showLogin, setShowLogin] = useState(false)
  
  return (
    <>
      <div className="controls-container">
        {/* 管理员按钮 */}
        {userRole === 'guest' ? (
          <button
            className="control-button"
            onClick={() => setShowLogin(true)}
            title="管理员登录"
          >
            <span className="control-icon">🔐</span>
            <span className="control-label">管理员</span>
          </button>
        ) : (
          <>
            <button
              className={`control-button ${isEditMode ? 'active' : ''}`}
              onClick={toggleEditMode}
              title="编辑模式"
            >
              <span className="control-icon">✏️</span>
              <span className="control-label">编辑模式</span>
              {isEditMode && <span className="active-indicator" />}
            </button>
            
            <button
              className="control-button"
              onClick={logout}
              title="退出登录"
            >
              <span className="control-icon">🚪</span>
              <span className="control-label">退出</span>
            </button>
          </>
        )}
        
        {/* 场景切换按钮 */}
        <button
          className="control-button"
          onClick={() => setShowSceneSelector(true)}
          title="切换场景"
        >
          <span className="control-icon">🎭</span>
          <span className="control-label">切换场景</span>
        </button>
        
        {/* AI对话按钮 */}
        <button
          className={`control-button ${showChat ? 'active' : ''}`}
          onClick={toggleChat}
          title="AI对话"
        >
          <span className="control-icon">💬</span>
          <span className="control-label">AI对话</span>
          {showChat && <span className="active-indicator" />}
        </button>
        
        {/* 帮助按钮 */}
        <button
          className="control-button"
          onClick={() => setShowInstructions(!showInstructions)}
          title="帮助"
        >
          <span className="control-icon">❓</span>
          <span className="control-label">帮助</span>
        </button>
      </div>
      
      {/* 登录对话框 */}
      {showLogin && <AdminLogin onClose={() => setShowLogin(false)} />}
    </>
  )
}
