import { useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { useAdminStore } from '../../store/useAdminStore'
import { Vector3 } from 'three'
import './PropertyPanel.css'

export default function PropertyPanel() {
  const isEditMode = useAdminStore((s) => s.isEditMode)
  const selectedPointId = useStore((s) => s.selectedPointId)
  const scenePoints = useStore((s) => s.scenePoints)
  const updateScenePoint = useStore((s) => s.updateScenePoint)

  const selectedPoint = scenePoints.find(p => p.id === selectedPointId)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [aiContext, setAiContext] = useState('')
  const [posX, setPosX] = useState(0)
  const [posY, setPosY] = useState(0)
  const [posZ, setPosZ] = useState(0)
  const [radius, setRadius] = useState(3)
  const [rotationX, setRotationX] = useState(0)
  const [rotationY, setRotationY] = useState(0)
  const [rotationZ, setRotationZ] = useState(0)
  const [scale, setScale] = useState(1)
  const [collisionRadius, setCollisionRadius] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (selectedPoint) {
      setName(selectedPoint.name)
      setDescription(selectedPoint.description || '')
      setAiContext(selectedPoint.aiContext || '')
      setPosX(Number(selectedPoint.position.x.toFixed(2)))
      setPosY(Number(selectedPoint.position.y.toFixed(2)))
      setPosZ(Number(selectedPoint.position.z.toFixed(2)))
      setRadius(selectedPoint.radius)
      setRotationX(Number((selectedPoint.rotation?.x ?? 0).toFixed(1)))
      setRotationY(Number((selectedPoint.rotation?.y ?? 0).toFixed(1)))
      setRotationZ(Number((selectedPoint.rotation?.z ?? 0).toFixed(1)))
      setScale(Number((selectedPoint.scale ?? 1).toFixed(2)))
      setCollisionRadius(selectedPoint.collisionRadius)
    }
  }, [selectedPoint])

  if (!isEditMode || !selectedPoint) return null

  const handleUpdate = () => {
    updateScenePoint(selectedPointId!, {
      name,
      description,
      aiContext,
      position: new Vector3(posX, posY, posZ),
      radius,
      rotation: new Vector3(rotationX, rotationY, rotationZ),
      scale,
      collisionRadius,
    })
  }

  return (
    <div className="property-panel">
      <div className="panel-header">
        <span className="panel-title">属性面板</span>
        <span className="panel-id">{selectedPoint.id}</span>
      </div>

      <div className="panel-content">
        <div className="property-group">
          <label>
            名称
            <span className="hint-text"> - 游客视角可见</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleUpdate}
            aria-label="名称"
            placeholder="模型显示名称"
          />
        </div>

        <div className="property-group">
          <label>位置 (米)</label>
          <div className="xyz-input">
            <input
              type="number"
              step="0.1"
              value={posX}
              onChange={(e) => setPosX(Number(e.target.value))}
              onBlur={handleUpdate}
              placeholder="X"
            />
            <input
              type="number"
              step="0.1"
              value={posY}
              onChange={(e) => setPosY(Number(e.target.value))}
              onBlur={handleUpdate}
              placeholder="Y"
            />
            <input
              type="number"
              step="0.1"
              value={posZ}
              onChange={(e) => setPosZ(Number(e.target.value))}
              onBlur={handleUpdate}
              placeholder="Z"
            />
          </div>
        </div>

        <div className="property-group">
          <label>
            触发半径 (m)
            <span className="hint-text"> - AI对话触发距离</span>
          </label>
          <input
            type="range"
            min="1"
            max="15"
            step="0.5"
            value={radius}
            onChange={(e) => {
              const newRadius = Number(e.target.value)
              setRadius(newRadius)
              // 实时更新以预览触发区域
              updateScenePoint(selectedPointId!, { radius: newRadius })
            }}
            className="radius-slider"
            aria-label="触发半径滑块"
          />
          <input
            type="number"
            step="0.5"
            min="1"
            max="15"
            value={radius}
            onChange={(e) => {
              const newRadius = Number(e.target.value)
              setRadius(newRadius)
              updateScenePoint(selectedPointId!, { radius: newRadius })
            }}
            onBlur={handleUpdate}
            aria-label="触发半径数值"
          />
          <div className="radius-hint">
            玩家进入此半径内将触发AI讲解
          </div>
        </div>

        <div className="property-group">
          <label>旋转 (度)</label>
          <div className="xyz-input">
            <input
              type="number"
              step="1"
              value={rotationX}
              onChange={(e) => setRotationX(Number(e.target.value))}
              onBlur={handleUpdate}
              placeholder="X"
            />
            <input
              type="number"
              step="1"
              value={rotationY}
              onChange={(e) => setRotationY(Number(e.target.value))}
              onBlur={handleUpdate}
              placeholder="Y"
            />
            <input
              type="number"
              step="1"
              value={rotationZ}
              onChange={(e) => setRotationZ(Number(e.target.value))}
              onBlur={handleUpdate}
              placeholder="Z"
            />
          </div>
        </div>

        <div className="property-group">
          <label>统一缩放</label>
          <input
            type="number"
            step="0.1"
            value={scale}
            min={0.1}
            onChange={(e) => setScale(Number(e.target.value))}
            onBlur={handleUpdate}
            aria-label="统一缩放"
          />
        </div>

        <div className="property-group">
          <label>
            碰撞半径 (m)
            <span className="hint-text"> - 玩家与模型的碰撞距离</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={collisionRadius ?? 0}
            onChange={(e) => {
              const newValue = Number(e.target.value)
              setCollisionRadius(newValue === 0 ? 0 : newValue)
              updateScenePoint(selectedPointId!, { collisionRadius: newValue === 0 ? 0 : newValue })
            }}
            className="radius-slider"
            aria-label="碰撞半径滑块"
          />
          <input
            type="number"
            step="0.5"
            min="0"
            max="10"
            value={collisionRadius ?? ''}
            onChange={(e) => {
              const val = e.target.value
              if (val === '') {
                setCollisionRadius(undefined)
              } else {
                const newValue = Number(val)
                setCollisionRadius(newValue)
              }
            }}
            onBlur={() => {
              updateScenePoint(selectedPointId!, { collisionRadius })
            }}
            placeholder="自动"
            aria-label="碰撞半径数值"
          />
          <div className="radius-hint">
            {collisionRadius === 0 ? (
              <span style={{ color: '#10b981' }}>✓ 无碰撞 - 玩家可穿过</span>
            ) : collisionRadius === undefined ? (
              <span>自动计算 - 基于模型尺寸</span>
            ) : (
              <span>碰撞半径: {collisionRadius}m</span>
            )}
          </div>
        </div>

        <div className="property-group">
          <label>描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleUpdate}
            placeholder="简短描述..."
            rows={2}
          />
        </div>

        <div className="property-group">
          <label>AI 提示词</label>
          <textarea
            value={aiContext}
            onChange={(e) => setAiContext(e.target.value)}
            onBlur={handleUpdate}
            placeholder="AI 讲解内容和上下文..."
            rows={6}
          />
        </div>

        <div className="property-group">
          <label>模型路径</label>
          <div className="model-path">{selectedPoint.modelPath || '无'}</div>
        </div>

        <button className="apply-btn" onClick={handleUpdate}>
          💾 应用更改
        </button>
      </div>
    </div>
  )
}


