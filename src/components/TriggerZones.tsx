// 触发区域组件
// 用于在场景中定义可交互的触发区域
import { useStore } from '../store/useStore'
import { useAdminStore } from '../store/useAdminStore'
import { Sphere, Html } from '@react-three/drei'
import './TriggerZones.css'

export default function TriggerZones() {
  const scenePoints = useStore((state) => state.scenePoints)
  const currentPoint = useStore((state) => state.currentPoint)
  const isEditMode = useAdminStore((state) => state.isEditMode)
  const selectedPointId = useStore((state) => state.selectedPointId)
  
  // 在编辑模式下，只显示选中模型的触发区域
  // 在开发模式下，显示所有触发区域
  const shouldShowZone = (pointId: string) => {
    if (isEditMode) {
      return selectedPointId === pointId
    }
    return import.meta.env.DEV
  }
  
  return (
    <group>
      {scenePoints.map((point) => {
        if (!shouldShowZone(point.id)) return null
        
        const isActive = currentPoint?.id === point.id
        const isSelected = selectedPointId === point.id
        
        return (
          <group key={point.id}>
            <Sphere
              args={[point.radius, 32, 32]}
              position={[point.position.x, 0.5, point.position.z]}
            >
              <meshBasicMaterial
                color={isSelected ? '#ffd700' : isActive ? '#00ff00' : '#ffff00'}
                transparent
                opacity={isSelected ? 0.15 : 0.08}
                wireframe
              />
            </Sphere>
            
            {/* 编辑模式下显示半径数值标签 */}
            {isEditMode && isSelected && (
              <Html
                position={[point.position.x, point.radius + 0.5, point.position.z]}
                center
                style={{ pointerEvents: 'none', zIndex: 1 }}
              >
                <div className="trigger-radius-label">
                  触发半径: {point.radius.toFixed(1)}m
                </div>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}
