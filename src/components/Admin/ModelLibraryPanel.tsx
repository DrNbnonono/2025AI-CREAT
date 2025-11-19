import { useEffect, useMemo, useRef, useState } from 'react'
import { useAdminStore } from '../../store/useAdminStore'
import { useStore } from '../../store/useStore'
import './ModelLibraryPanel.css'

export default function ModelLibraryPanel() {
  const isEditMode = useAdminStore((s) => s.isEditMode)
  const placingModelPath = useStore((s) => s.placingModelPath)
  const setPlacingModelPath = useStore((s) => s.setPlacingModelPath)
  const setSelectedPoint = useStore((s) => s.setSelectedPoint)
  const selectedPointId = useStore((s) => s.selectedPointId)
  const exportConfiguration = useStore((state) => state.exportConfiguration)
  const importConfiguration = useStore((state) => state.importConfiguration)

  const [files, setFiles] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('editor:model-lib-collapsed')
    return stored ? stored === 'true' : false
  })
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 360
    const stored = localStorage.getItem('editor:model-lib-width')
    const value = stored ? Number(stored) : 360
    if (Number.isNaN(value)) return 360
    return Math.min(Math.max(value, 280), 520)
  })
  const [position, setPosition] = useState({ x: 20, y: 150 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hasDragged, setHasDragged] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)
  const isResizingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
        alert('配置导入完成')
      }
    } catch (error) {
      console.error('导入配置失败:', error)
      alert('导入失败，请检查文件格式')
    }
  }

  useEffect(() => {
    fetch('/models/index.json')
      .then((r) => r.json())
      .then((data) => setFiles(data.files || []))
      .catch(() => setFiles([]))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('editor:model-lib-collapsed', collapsed ? 'true' : 'false')
  }, [collapsed])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('editor:model-lib-width', String(panelWidth))
  }, [panelWidth])

  // 从localStorage读取位置
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedPosition = localStorage.getItem('model-library-position')
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition))
    }
  }, [])

  // 保存位置到localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('model-library-position', JSON.stringify(position))
  }, [position])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleMove = (event: MouseEvent) => {
      if (!isResizingRef.current || collapsed) return
      const newWidth = event.clientX - 32
      setPanelWidth(Math.min(Math.max(newWidth, 280), 520))
    }

    const stopResize = () => {
      isResizingRef.current = false
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', stopResize)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', stopResize)
    }
  }, [collapsed])

  // 拖动功能
  const handleMouseDown = (e: React.MouseEvent) => {
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

  const handleToggleClick = (e: React.MouseEvent) => {
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return files
    return files.filter((f) => f.toLowerCase().includes(q))
  }, [files, query])

  if (!isEditMode) return null

  // 选中模型时禁用放置功能
  const isPlacingDisabled = !!selectedPointId

  if (collapsed) {
    return (
      <button
        ref={toggleButtonRef}
        className="lib-toggle-floating"
        onMouseDown={handleMouseDown}
        onClick={handleToggleClick}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        title="展开模型库"
      >
        📂 模型库
      </button>
    )
  }

  return (
    <div
      ref={panelRef}
      className="model-lib"
      onMouseDown={handleMouseDown}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isDragging ? 9999 : 1200,
        width: `${panelWidth}px`,
      }}
    >
      <div className="lib-body">
        <div className="lib-header">
          <button
            className="lib-collapse"
            onClick={() => setCollapsed(true)}
            title="收起模型库"
          >
            ‹
          </button>
          <input
            className="lib-search"
            placeholder="搜索模型"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="lib-clear"
            onClick={() => {
              setPlacingModelPath(null)
              setSelectedPoint(null)
            }}
            disabled={!placingModelPath && !selectedPointId}
          >
            清除
          </button>
          <button className="lib-action" onClick={handleExport}>导出</button>
          <button
            className="lib-action"
            onClick={() => fileInputRef.current?.click()}
          >导入</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                handleImport(file)
                event.target.value = ''
              }
            }}
          />
        </div>
        <div className="lib-status">
          {isPlacingDisabled ? (
            <span className="status-warning">⚠️ 正在编辑：请按 Esc 退出后再放置模型</span>
          ) : placingModelPath ? (
            <span className="status-active">待放置：{placingModelPath.split('/').slice(-1)[0]}</span>
          ) : (
            <span className="status-tip">点击下方模型以选择，支持拖拽放置</span>
          )}
        </div>

        <div className="lib-tabs">
          <button className="tab active" type="button">模型</button>
        </div>

        <div className="lib-list">
          {filtered.length === 0 && (
            <div className="empty-state">暂无模型，拖入 .glb/.gltf 文件以加载</div>
          )}
          {filtered.map((p) => (
            <button
              key={p}
              className={`lib-item ${placingModelPath === p ? 'active' : ''}`}
              onClick={() => {
                if (!isPlacingDisabled) {
                  setPlacingModelPath(p)
                }
              }}
              disabled={isPlacingDisabled}
              title={isPlacingDisabled ? '请先取消选择（Esc）' : p}
            >
              <span className="item-name">{p.split('/').slice(-1)[0]}</span>
              <span className="item-path">{p.replace('/models/', '')}</span>
            </button>
          ))}
        </div>

        <div
          className="lib-resize-handle"
          onMouseDown={() => {
            isResizingRef.current = true
          }}
        />
      </div>
    </div>
  )
}


