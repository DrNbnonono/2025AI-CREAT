import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 用户角色
export type UserRole = 'guest' | 'admin'

// 管理员商店状态
interface AdminState {
  // 用户信息
  userRole: UserRole
  isAuthenticated: boolean
  
  // 编辑模式
  isEditMode: boolean
  
  // Actions
  login: (password: string) => boolean
  logout: () => void
  toggleEditMode: () => void
  setUserRole: (role: UserRole) => void
}

// 简单的密码验证（实际项目中应该用更安全的方式）
const ADMIN_PASSWORD = 'admin2025'

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // 初始状态
      userRole: 'guest',
      isAuthenticated: false,
      isEditMode: false,
      
      // 登录
      login: (password: string) => {
        if (password === ADMIN_PASSWORD) {
          set({ 
            userRole: 'admin', 
            isAuthenticated: true 
          })
          return true
        }
        return false
      },
      
      // 登出
      logout: () => {
        set({ 
          userRole: 'guest', 
          isAuthenticated: false,
          isEditMode: false 
        })
      },
      
      // 切换编辑模式
      toggleEditMode: () => {
        const { userRole, isEditMode } = get()
        if (userRole === 'admin') {
          set({ isEditMode: !isEditMode })
        }
      },
      
      // 设置用户角色
      setUserRole: (role) => {
        set({ 
          userRole: role,
          isAuthenticated: role === 'admin'
        })
      },
    }),
    {
      name: 'admin-storage', // localStorage 中的 key
    }
  )
)
