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
  const [posX, setPosX] = useState(0)
  const [posY, setPosY] = useState(0)
  const [posZ, setPosZ] = useState(0)
  const [radius, setRadius] = useState(3)
  
  useEffect(() => {
    if (selectedPoint) {
      setName(selectedPoint.name)
      setPosX(Number(selectedPoint.position.x.toFixed(2)))
      setPosY(Number(selectedPoint.position.y.toFixed(2)))
      setPosZ(Number(selectedPoint.position.z.toFixed(2)))
      setRadius(selectedPoint.radius)
    }
  }, [selectedPoint])
  
  if (!isEditMode || !selectedPoint) return null
  
  const handleUpdate = () => {
    updateScenePoint(selectedPointId!, {
      name,
      position: new Vector3(posX, posY, posZ),
      radius,
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
          <label>名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleUpdate}
          />
        </div>
        
        <div className="property-group">
          <label>位置</label>
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
          <label>交互半径</label>
          <input
            type="number"
            step="0.5"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            onBlur={handleUpdate}
          />
        </div>
        
        <div className="property-group">
          <label>模型路径</label>
          <div className="model-path">{selectedPoint.modelPath || '无'}</div>
        </div>
      </div>
    </div>
  )
}


