import { useEffect } from 'react'
import { useState } from 'react'
import { useAdminStore } from '../../store/useAdminStore'
import { useStore } from '../../store/useStore'
import LLMConfigPanel from './LLMConfigPanel'
import './EditorToolbar.css'

export default function EditorToolbar() {
  const [showLLMConfig, setShowLLMConfig] = useState(false)
  const isEditMode = useAdminStore((s) => s.isEditMode)
  const transformMode = useAdminStore((s) => s.transformMode)
  const setTransformMode = useAdminStore((s) => s.setTransformMode)
  const selectedPointId = useStore((s) => s.selectedPointId)
  const setSelectedPoint = useStore((s) => s.setSelectedPoint)
  const deleteScenePoint = useStore((s) => s.deleteScenePoint)
  
  useEffect(() => {
    if (!isEditMode) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在输入框或文本域，不处理快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key.toLowerCase()) {
        case 'g':
          e.preventDefault()
          setTransformMode('translate')
          break
        case 'r':
          e.preventDefault()
          setTransformMode('rotate')
          break
        case 't': // 改为 T 键，避免与 WASD 的 S 冲突
          e.preventDefault()
          setTransformMode('scale')
          break
        case 'delete':
        case 'backspace':
          if (selectedPointId) {
            e.preventDefault()
            if (confirm('确定删除选中的模型？')) {
              deleteScenePoint(selectedPointId)
            }
          }
          break
        case 'escape':
          e.preventDefault()
          setSelectedPoint(null)
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEditMode, selectedPointId, setSelectedPoint, deleteScenePoint])
  
  if (!isEditMode) return null
  
  return (
    <div className="editor-toolbar">
      <div className="toolbar-section">
        <span className="toolbar-label">编辑模式</span>
        <div className="toolbar-modes">
          <button
            className={`mode-btn ${transformMode === 'translate' ? 'active' : ''}`}
            onClick={() => setTransformMode('translate')}
            title="移动 (G)"
          >
            <span>↔️</span>
            <span className="mode-label">移动</span>
          </button>
          <button
            className={`mode-btn ${transformMode === 'rotate' ? 'active' : ''}`}
            onClick={() => setTransformMode('rotate')}
            title="旋转 (R)"
          >
            <span>🔄</span>
            <span className="mode-label">旋转</span>
          </button>
          <button
            className={`mode-btn ${transformMode === 'scale' ? 'active' : ''}`}
            onClick={() => setTransformMode('scale')}
            title="缩放 (T)"
          >
            <span>⤢</span>
            <span className="mode-label">缩放</span>
          </button>
        </div>
      </div>
      
      {selectedPointId && (
        <div className="toolbar-section">
          <span className="toolbar-label">选中对象</span>
          <div className="toolbar-actions">
            <button
              className="action-btn delete"
              onClick={() => {
                if (confirm('确定删除选中的模型？')) {
                  deleteScenePoint(selectedPointId)
                }
              }}
              title="删除 (Delete)"
            >
              🗑️ 删除
            </button>
            <button
              className="action-btn"
              onClick={() => setSelectedPoint(null)}
              title="取消选择 (Esc)"
            >
              ❌ 取消
            </button>
          </div>
        </div>
      )}
      
      <div className="toolbar-section">
        <span className="toolbar-label">AI配置</span>
        <div className="toolbar-actions">
          <button
            className="action-btn"
            onClick={() => setShowLLMConfig(true)}
            title="LLM配置"
          >
            🤖 LLM设置
          </button>
        </div>
      </div>

      <div className="toolbar-hints">
        <span>💡 快捷键:</span>
        <span>G移动</span>
        <span>R旋转</span>
        <span>T缩放</span>
        <span>Del删除</span>
        <span>Esc取消</span>
      </div>
      
      {showLLMConfig && <LLMConfigPanel onClose={() => setShowLLMConfig(false)} />}
    </div>
  )
}

// 导出 transformMode 供 SceneEnvironment 使用（现在从全局状态获取）
export function useTransformMode() {
  return useAdminStore((s) => s.transformMode)
}

