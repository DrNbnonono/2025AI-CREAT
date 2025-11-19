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
  const updateSceneMeta = useStore((state) => state.updateSceneMeta)
  const deleteScene = useStore((state) => state.deleteScene)
  const setSelectedPoint = useStore((state) => state.setSelectedPoint)
  const currentSceneName = sceneMeta[currentTheme]?.name || currentTheme

  const [showAddForm, setShowAddForm] = useState(false)
  const [showSceneForm, setShowSceneForm] = useState(false)
  const [showEditSceneForm, setShowEditSceneForm] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 90 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hasDragged, setHasDragged] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('model-manager-collapsed')
    return stored ? stored === 'true' : false
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
  const [editSceneForm, setEditSceneForm] = useState({
    name: '',
    description: '',
    icon: '',
  })
  const [modelOptions, setModelOptions] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

  const refreshModelList = useCallback(() => {
    fetch('/models/index.json?' + Date.now())
      .then((r) => r.json())
      .then((data) => setModelOptions(data.files || []))
      .catch(() => setModelOptions([]))
  }, [])

  useEffect(() => {
    refreshModelList()
  }, [refreshModelList])

  // 从localStorage读取位置
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedPosition = localStorage.getItem('model-manager-position')
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition))
    }
  }, [])

  // 保存位置到localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('model-manager-position', JSON.stringify(position))
  }, [position])

  // 拖动功能
  const handleMouseDown = (e: ReactMouseEvent) => {
    const isToggleButton = collapsed
    const ref = isToggleButton ? toggleButtonRef : panelRef
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
    setHasDragged(false)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    const deltaX = Math.abs(e.clientX - (position.x + dragOffset.x))
    const deltaY = Math.abs(e.clientY - (position.y + dragOffset.y))
    if (deltaX > 3 || deltaY > 3) {
      setHasDragged(true)
    }
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleToggleClick = (e: ReactMouseEvent) => {
    if (hasDragged) {
      e.stopPropagation()
      setHasDragged(false)
      return
    }
    setCollapsed(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('model-manager-collapsed', collapsed ? 'true' : 'false')
  }, [collapsed])

  if (!isEditMode) return null

  // 收起状态显示浮动按钮
  if (collapsed) {
    return (
      <button
        ref={toggleButtonRef}
        className="model-manager-toggle"
        onMouseDown={handleMouseDown}
        onClick={handleToggleClick}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        title="展开模型管理面板"
      >
        📦 模型管理
      </button>
    )
  }

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
    
    // createNewScene 已经会自动切换到新场景并更新所有状态
    createNewScene(themeId, {
      name,
      description,
      defaultPrompt: prompt,
      icon: icon || '🎭',
    })
    
    setShowSceneForm(false)
    setSceneForm({ themeId: '' as SceneThemeType, name: '', description: '', prompt: '', icon: '' })
    
    // 给用户反馈
    setTimeout(() => {
      alert(`场景"${name}"创建成功！\n场景ID: ${themeId}\n\n现在可以开始添加模型点位了。`)
    }, 300)
  }

  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(glb|gltf)$/i)) {
      alert('请上传 .glb 或 .gltf 格式的3D模型文件')
      return
    }

    const formData = new FormData()
    formData.append('model', file)

    try {
      setUploadProgress('正在上传...')
      
      // 使用简单的本地上传API
      const response = await fetch('/api/upload-model', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const result = await response.json()
      setUploadProgress('上传成功！刷新模型列表...')
      
      // 等待文件系统同步
      setTimeout(() => {
        refreshModelList()
        setUploadProgress(null)
        alert(`模型已上传到: ${result.path}`)
      }, 1000)
    } catch (error) {
      console.error('上传失败:', error)
      setUploadProgress(null)
      alert('上传失败，请确保后端上传API已配置')
    }
  }

  const handleEditScene = () => {
    setEditSceneForm({
      name: sceneMeta[currentTheme]?.name || '',
      description: sceneMeta[currentTheme]?.description || '',
      icon: sceneMeta[currentTheme]?.icon || '',
    })
    setShowEditSceneForm(true)
  }

  const handleSaveSceneMeta = () => {
    const name = editSceneForm.name.trim()
    const description = editSceneForm.description.trim()
    const icon = editSceneForm.icon.trim()

    if (!name) {
      alert('请填写场景名称')
      return
    }

    updateSceneMeta(currentTheme, {
      name,
      description,
      icon: icon || '🎭',
    })
    
    setShowEditSceneForm(false)
    alert('场景信息已更新')
  }

  const handleDeleteScene = () => {
    // 检查是否为默认场景
    const defaultScenes = ['museum', 'redMansion', 'silkRoad']
    if (defaultScenes.includes(currentTheme)) {
      alert('⚠️ 无法删除内置场景\n\n内置场景（博物馆、红楼梦、丝绸之路）是系统预设的，不能删除。')
      return
    }

    // 确认删除
    const sceneName = sceneMeta[currentTheme]?.name || currentTheme
    const confirmed = window.confirm(
      `⚠️ 确定要删除场景"${sceneName}"吗？\n\n删除后将无法恢复：\n` +
      `• 该场景的所有点位数据\n` +
      `• 场景配置信息\n` +
      `• 相关的模型引用\n\n` +
      `删除后将自动切换到博物馆场景。`
    )

    if (!confirmed) return

    const success = deleteScene(currentTheme)
    if (success) {
      alert(`✅ 场景"${sceneName}"已成功删除`)
    } else {
      alert('❌ 删除失败，请稍后重试')
    }
  }

  // 检查当前场景是否为默认场景
  const isDefaultScene = ['museum', 'redMansion', 'silkRoad'].includes(currentTheme)
  
  return (
    <div
      ref={panelRef}
      className="model-manager"
      onMouseDown={handleMouseDown}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isDragging ? 9999 : 950,
      }}
    >
      <div className="manager-header">
        <h3>📦 模型管理</h3>
        <span className="current-scene">当前场景: {currentSceneName}</span>
        <button className="manager-collapse-btn" onClick={() => setCollapsed(true)} title="收起面板">‹</button>
      </div>

      <div className="manager-actions">
        <button className="action-btn" onClick={() => setShowAddForm(true)}>➕ 添加点位</button>
        <button className="action-btn" onClick={() => uploadInputRef.current?.click()} disabled={!!uploadProgress}>
          📁 {uploadProgress || '上传模型'}
        </button>
        <button className="action-btn" onClick={handleEditScene}>✏️ 编辑场景</button>
        {!isDefaultScene && (
          <button
            className="action-btn action-btn-danger"
            onClick={handleDeleteScene}
            title="删除当前自定义场景"
          >
            🗑️ 删除场景
          </button>
        )}
        <button className="action-btn" onClick={handleExport}>📤 导出配置</button>
        <button className="action-btn" onClick={() => document.getElementById('scene-import-input')?.click()}>📥 导入配置</button>
        <button className="action-btn" onClick={() => setShowSceneForm(true)}>🆕 新建场景</button>
        <input
          id="scene-import-input"
          type="file"
          accept="application/json"
          aria-label="导入场景配置文件"
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
        <input
          type="file"
          accept=".glb,.gltf"
          aria-label="上传3D模型文件"
          style={{ display: 'none' }}
          ref={uploadInputRef}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              handleFileUpload(file)
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
                <button className="btn-edit" onClick={() => setSelectedPoint(point.id)}>编辑</button>
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

      {showEditSceneForm && (
        <div className="add-form-overlay" onClick={() => setShowEditSceneForm(false)}>
          <div className="add-form" onClick={(e) => e.stopPropagation()}>
            <h3>编辑场景信息</h3>
            <div className="form-field">
              <label>场景标识</label>
              <input
                value={currentTheme}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <small style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                场景标识不可修改
              </small>
            </div>
            <div className="form-field">
              <label>场景名称</label>
              <input
                value={editSceneForm.name}
                onChange={(e) => setEditSceneForm({ ...editSceneForm, name: e.target.value })}
                placeholder="例如：清明上河图场景"
              />
            </div>
            <div className="form-field">
              <label>场景描述</label>
              <textarea
                value={editSceneForm.description}
                onChange={(e) => setEditSceneForm({ ...editSceneForm, description: e.target.value })}
                rows={4}
                placeholder="一句话描述"
              />
            </div>
            <div className="form-field">
              <label>场景图标（emoji）</label>
              <input
                value={editSceneForm.icon}
                onChange={(e) => setEditSceneForm({ ...editSceneForm, icon: e.target.value })}
                placeholder="例如：🎨"
              />
            </div>
            <div className="form-buttons">
              <button className="btn-save" onClick={handleSaveSceneMeta}>保存</button>
              <button className="btn-cancel" onClick={() => setShowEditSceneForm(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
