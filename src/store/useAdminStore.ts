// 管理员商店状态管理
// 用于存储管理员相关的状态，如用户角色、登录状态、编辑模式等
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
  isUiInteracting: boolean
  transformMode: 'translate' | 'rotate' | 'scale'
  
  // Actions
  login: (password: string) => boolean
  logout: () => void
  toggleEditMode: () => void
  setUserRole: (role: UserRole) => void
  setIsUiInteracting: (value: boolean) => void
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void
}

// 简单的密码验证（实际项目中应该用更安全的方式）
const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string) || 'admin2025'

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // 初始状态
      userRole: 'guest',
      isAuthenticated: false,
      isEditMode: false,
      isUiInteracting: false,
      transformMode: 'translate',
      
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
          isEditMode: false,
          isUiInteracting: false,
        })
      },
      
      // 切换编辑模式
      toggleEditMode: () => {
        const { userRole, isEditMode } = get()
        if (userRole === 'admin') {
          set({ isEditMode: !isEditMode, isUiInteracting: false })
        }
      },
      
      // 设置用户角色
      setUserRole: (role) => {
        set({ 
          userRole: role,
          isAuthenticated: role === 'admin'
        })
      },

      setIsUiInteracting: (value) => set({ isUiInteracting: value }),
      
      setTransformMode: (mode) => set({ transformMode: mode }),
    }),
    {
      name: 'admin-storage', // localStorage 中的 key
    }
  )
)
