import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { Vector3 } from 'three'
import { useStore, type SceneThemeType } from '../../store/useStore'
import { useAdminStore } from '../../store/useAdminStore'
import './ModelManager.css'

export default function ModelManager() {
  const isEditMode = useAdminStore((state) => state.isEditMode)
  const setIsUiInteracting = useAdminStore((state) => state.setIsUiInteracting)
  const currentTheme = useStore((state) => state.currentTheme)
  const scenePoints = useStore((state) => state.scenePoints)
  const sceneMeta = useStore((state) => state.sceneMeta)
  const availableScenes = useStore((state) => state.availableScenes)
  const addScenePoint = useStore((state) => state.addScenePoint)
  const deleteScenePoint = useStore((state) => state.deleteScenePoint)
  const exportConfiguration = useStore((state) => state.exportConfiguration)
  const importConfiguration = useStore((state) => state.importConfiguration)
  const createNewScene = useStore((state) => state.createNewScene)
  const setCurrentTheme = useStore((state) => state.switchScene)
  const currentSceneName = sceneMeta[currentTheme]?.name || currentTheme
  
  const panelRef = useRef<HTMLDivElement | null>(null)
  const resizeState = useRef<{ startY: number; startHeight: number } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSceneForm, setShowSceneForm] = useState(false)
  const [panelHeight, setPanelHeight] = useState(() => {
    if (typeof window === 'undefined') return 380
    const stored = Number.parseInt(localStorage.getItem('model-manager-height') || '', 10)
    if (Number.isFinite(stored) && stored >= 260) {
      return stored
    }
    return 380
  })
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    position: { x: 0, y: 0, z: 0 },
    radius: 3,
    description: '',
    aiContext: '',
    modelPath: '/models/neighbourhood/source/Untitled.glb',
  })
  const [sceneForm, setSceneForm] = useState({
    themeId: '' as SceneThemeType,
    name: '',
    description: '',
    prompt: '',
    icon: '',
  })
  const [modelOptions, setModelOptions] = useState<string[]>([])
  const importInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    fetch('/models/index.json')
      .then((r) => r.json())
      .then((data) => setModelOptions(data.files || []))
      .catch(() => setModelOptions([]))
  }, [])

  // 顶部拖拽调整高度
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const deltaY = startYRef.current - e.clientY
      const newHeight = Math.max(300, Math.min(startHeightRef.current + deltaY, window.innerHeight - 200))
      setPanelHeight(newHeight)
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
    }

    if (isDraggingRef.current) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingRef.current])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const maxHeight = Math.max(260, window.innerHeight - 200)
    setPanelHeight((height) => Math.min(Math.max(height, 260), maxHeight))
  }, [])

  const handleResizeMove = useCallback((event: MouseEvent) => {
    if (!resizeState.current) return
    event.preventDefault()
    const { startY, startHeight } = resizeState.current
    const delta = startY - event.clientY
    const maxHeight = Math.max(260, window.innerHeight - 220)
    const nextHeight = Math.min(Math.max(startHeight + delta, 260), maxHeight)
    setPanelHeight(nextHeight)
  }, [])

const handleResizeEnd = useCallback(() => {
    if (!resizeState.current) return
    resizeState.current = null
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    localStorage.setItem('model-manager-height', String(panelRef.current?.offsetHeight ?? panelHeight))
    setTimeout(() => setIsUiInteracting(false), 0)
  }, [handleResizeMove, panelHeight, setIsUiInteracting])

  const handleResizeStart = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    event.preventDefault()
    if (!panelRef.current) return
    resizeState.current = {
      startY: event.clientY,
      startHeight: panelRef.current.offsetHeight,
    }
    setIsUiInteracting(true)
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
  }, [handleResizeMove, handleResizeEnd, setIsUiInteracting])

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [handleResizeEnd, handleResizeMove])
  
  if (!isEditMode) return null
  
  const handleAddPoint = () => {
    if (!formData.id || !formData.name || !formData.modelPath) return
    addScenePoint({
      id: formData.id,
      name: formData.name,
      position: new Vector3(formData.position.x, formData.position.y, formData.position.z),
      radius: formData.radius,
      description: formData.description,
      aiContext: formData.aiContext,
      modelPath: formData.modelPath,
    })
    setShowAddForm(false)
  }

  const handleExport = () => {
    const data = exportConfiguration()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `scene-config-${data.currentTheme}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const payload = JSON.parse(text)
      const result = await importConfiguration(payload)
      if (!result.ok) {
        const missing = (result.missingModels || []).join('\n')
        alert(`导入成功，但以下模型缺失:\n${missing}`)
      } else {
        alert('场景配置导入完成')
      }
    } catch (error) {
      console.error('导入失败:', error)
      alert('导入失败，请检查文件格式')
    }
  }

  const handleCreateScene = () => {
    const themeId = sceneForm.themeId.trim()
    const name = sceneForm.name.trim()
    const description = sceneForm.description.trim()
    const prompt = sceneForm.prompt.trim()
    const icon = sceneForm.icon.trim()

    if (!themeId || !name || !prompt) {
      alert('请填写场景标识、名称和默认提示词')
      return
    }

    if (availableScenes.includes(themeId)) {
      alert('该场景标识已存在，请使用新的标识')
      return
    }
    createNewScene(themeId, {
      name,
      description,
      defaultPrompt: prompt,
      icon,
    })
    setCurrentTheme(themeId)
    setShowSceneForm(false)
    setSceneForm({ themeId: '' as SceneThemeType, name: '', description: '', prompt: '', icon: '' })
  }
  
  return (
    <div
      className="model-manager"
      ref={panelRef}
      style={{ height: panelHeight, maxHeight: 'calc(100vh - 200px)' }}
    >
      <div className="model-manager-resizer" onMouseDown={handleResizeStart}>
        <div className="resizer-grip" />
      </div>
      <div className="manager-header">
        <h3>📦 模型管理</h3>
        <span className="current-scene">当前场景: {currentSceneName}</span>
      </div>

      <div className="manager-actions">
        <button className="action-btn" onClick={() => setShowAddForm(true)}>➕ 添加点位</button>
        <button className="action-btn" onClick={handleExport}>📤 导出配置</button>
        <button className="action-btn" onClick={() => document.getElementById('scene-import-input')?.click()}>📥 导入配置</button>
        <button className="action-btn" onClick={() => setShowSceneForm(true)}>🆕 新建场景</button>
        <input
          id="scene-import-input"
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          ref={importInputRef}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              handleImport(file)
              event.target.value = ''
            }
          }}
        />
      </div>

      <div className="model-manager-content">
        <div className="model-list">
          <h4>场景点位列表</h4>
          {scenePoints.map((point) => (
            <div key={point.id} className="model-item">
              <div className="model-info">
                <strong>{point.name}</strong>
                <span className="model-position">
                  ({point.position.x.toFixed(1)}, {point.position.y.toFixed(1)}, {point.position.z.toFixed(1)})
                </span>
                {point.modelPath && (
                  <span className="model-path">{point.modelPath}</span>
                )}
              </div>
              <div className="model-actions">
                <button className="btn-edit">编辑</button>
                <button className="btn-delete" onClick={() => deleteScenePoint(point.id)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {showAddForm && (
        <div className="add-form-overlay" onClick={() => setShowAddForm(false)}>
          <div className="add-form" onClick={(e) => e.stopPropagation()}>
            <h3>添加场景点位</h3>
            
            <div className="form-field">
              <label>ID (唯一标识)</label>
              <input
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="例如: ming-vase"
              />
            </div>
            
            <div className="form-field">
              <label>名称</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如: 明代青花瓷瓶"
              />
            </div>
            
            <div className="form-field">
              <label>位置 (X, Y, Z)</label>
              <div className="position-inputs">
                <input
                  type="number"
                  value={formData.position.x}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    position: { ...formData.position, x: parseFloat(e.target.value) }
                  })}
                  placeholder="X"
                />
                <input
                  type="number"
                  value={formData.position.y}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    position: { ...formData.position, y: parseFloat(e.target.value) }
                  })}
                  placeholder="Y"
                />
                <input
                  type="number"
                  value={formData.position.z}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    position: { ...formData.position, z: parseFloat(e.target.value) }
                  })}
                  placeholder="Z"
                />
              </div>
            </div>
            
            <div className="form-field">
              <label>模型路径</label>
              <input
                value={formData.modelPath}
                onChange={(e) => setFormData({ ...formData, modelPath: e.target.value })}
                placeholder="/models/your-model.glb"
                list="model-suggestions"
              />
              <datalist id="model-suggestions">
                {modelOptions.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            
            <div className="form-field">
              <label>简短描述</label>
              <input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="一句话描述"
              />
            </div>
            
            <div className="form-field">
              <label>AI 知识库（用于对话的预置 Prompt）</label>
              <textarea
                value={formData.aiContext}
                onChange={(e) => setFormData({ ...formData, aiContext: e.target.value })}
                placeholder="详细的文化知识或解说词，将用于系统提示词的一部分（例如：历史背景、工艺、故事）。"
                rows={10}
              />
            </div>
            
            <div className="form-buttons">
              <button className="btn-save" onClick={handleAddPoint}>保存</button>
              <button className="btn-cancel" onClick={() => setShowAddForm(false)}>取消</button>
            </div>
          </div>
        </div>
      )}

      {showSceneForm && (
        <div className="add-form-overlay" onClick={() => setShowSceneForm(false)}>
          <div className="add-form" onClick={(e) => e.stopPropagation()}>
            <h3>创建新场景</h3>
            <div className="form-field">
              <label>场景标识（英文/拼音）</label>
              <input
                value={sceneForm.themeId}
                onChange={(e) => setSceneForm({ ...sceneForm, themeId: e.target.value as SceneThemeType })}
                placeholder="例如：qingming"
              />
            </div>
            <div className="form-field">
              <label>场景名称</label>
              <input
                value={sceneForm.name}
                onChange={(e) => setSceneForm({ ...sceneForm, name: e.target.value })}
                placeholder="例如：清明上河图场景"
              />
            </div>
            <div className="form-field">
              <label>场景描述</label>
              <input
                value={sceneForm.description}
                onChange={(e) => setSceneForm({ ...sceneForm, description: e.target.value })}
                placeholder="一句话描述"
              />
            </div>
            <div className="form-field">
              <label>默认 AI 提示词</label>
              <textarea
                value={sceneForm.prompt}
                onChange={(e) => setSceneForm({ ...sceneForm, prompt: e.target.value })}
                rows={6}
                placeholder="请填写默认的场景介绍或导览词，用户进入场景时将作为系统提示词。"
              />
            </div>
            <div className="form-field">
              <label>场景图标（可选 emoji）</label>
              <input
                value={sceneForm.icon}
                onChange={(e) => setSceneForm({ ...sceneForm, icon: e.target.value })}
                placeholder="例如：🎨"
              />
            </div>
            <div className="form-buttons">
              <button className="btn-save" onClick={handleCreateScene}>创建场景</button>
              <button className="btn-cancel" onClick={() => setShowSceneForm(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
