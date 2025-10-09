import { useEffect, useMemo, useState } from 'react'
import { useAdminStore } from '../../store/useAdminStore'
import { useStore } from '../../store/useStore'
import './ModelLibraryPanel.css'

export default function ModelLibraryPanel() {
  const isEditMode = useAdminStore((s) => s.isEditMode)
  const placingModelPath = useStore((s) => s.placingModelPath)
  const setPlacingModelPath = useStore((s) => s.setPlacingModelPath)
  const setSelectedPoint = useStore((s) => s.setSelectedPoint)
  const selectedPointId = useStore((s) => s.selectedPointId)
  const addScenePoint = useStore((s) => s.addScenePoint)
  const currentTheme = useStore((s) => s.currentTheme)

  const [files, setFiles] = useState<string[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/models/index.json')
      .then((r) => r.json())
      .then((data) => setFiles(data.files || []))
      .catch(() => setFiles([]))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return files
    return files.filter((f) => f.toLowerCase().includes(q))
  }, [files, query])

  if (!isEditMode) return null

  // 选中模型时禁用放置功能
  const isPlacingDisabled = !!selectedPointId

  return (
    <div className="model-lib">
      <div className="lib-header">
        <input
          className="lib-search"
          placeholder="搜索模型"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isPlacingDisabled ? (
          <div className="lib-selected" style={{ color: 'rgba(255,100,100,0.9)' }}>
            ⚠️ 请先取消选择（按 Esc）才能放置新模型
          </div>
        ) : placingModelPath ? (
          <div className="lib-selected">
            待放置: {placingModelPath.split('/').slice(-1)[0]}
          </div>
        ) : (
          <div className="lib-selected" style={{ color: 'rgba(255,255,255,0.5)' }}>
            点击下方模型以选择
          </div>
        )}
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
      </div>
      <div className="lib-list">
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
            {p.split('/').slice(-1)[0]}
          </button>
        ))}
      </div>
    </div>
  )
}


