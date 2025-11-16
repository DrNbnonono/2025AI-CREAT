import { useState } from 'react'
import { useAdminStore } from '../../store/useAdminStore'
import './AdminLogin.css'

interface AdminLoginProps {
  onClose: () => void
}

export default function AdminLogin({ onClose }: AdminLoginProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const login = useAdminStore((state) => state.login)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (login(password)) {
      setError('')
      onClose()
    } else {
      setError('密码错误')
      setPassword('')
    }
  }
  
  return (
    <div className="admin-login-overlay" onClick={onClose}>
      <div className="admin-login-panel" onClick={(e) => e.stopPropagation()}>
        <h2>🔐 管理员登录</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理员密码"
              autoFocus
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="button-group">
            <button type="submit" className="login-button">
              登录
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              取消
            </button>
          </div>
        </form>
        
        <div className="login-hint">
          💡 提示：默认密码为 <code>{import.meta.env.VITE_ADMIN_PASSWORD || 'admin2025'}</code>
        </div>
      </div>
    </div>
  )
}
