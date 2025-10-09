import { useState, useEffect } from 'react'
import { useAdminStore } from '../../store/useAdminStore'
import { useStore } from '../../store/useStore'
import './EditorToolbar.css'

export default function EditorToolbar() {
  const isEditMode = useAdminStore((s) => s.isEditMode)
  const selectedPointId = useStore((s) => s.selectedPointId)
  const setSelectedPoint = useStore((s) => s.setSelectedPoint)
  const deleteScenePoint = useStore((s) => s.deleteScenePoint)
  const currentTheme = useStore((s) => s.currentTheme)
  
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate')
  
  useEffect(() => {
    if (!isEditMode) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key.toLowerCase()) {
        case 'g':
          setTransformMode('translate')
          break
        case 'r':
          setTransformMode('rotate')
          break
        case 's':
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
            title="缩放 (S)"
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
      
      <div className="toolbar-hints">
        <span>💡 快捷键:</span>
        <span>G移动</span>
        <span>R旋转</span>
        <span>S缩放</span>
        <span>Del删除</span>
        <span>Esc取消</span>
      </div>
    </div>
  )
}

// 导出 transformMode 供 SceneEnvironment 使用
export function useTransformMode() {
  const [mode, setMode] = useState<'translate' | 'rotate' | 'scale'>('translate')
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key.toLowerCase()) {
        case 'g': setMode('translate'); break
        case 'r': setMode('rotate'); break
        case 's': setMode('scale'); break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  return mode
}

