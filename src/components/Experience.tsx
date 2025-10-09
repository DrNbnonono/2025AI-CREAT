import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useStore } from '../store/useStore'
import { useAdminStore } from '../store/useAdminStore'
import FirstPersonControls from './FirstPersonControls'
import EditorControls from './EditorControls'
import ModelPlacementHelper from './ModelPlacementHelper'
import SceneEnvironment from './SceneEnvironment'
import TriggerZones from './TriggerZones'

export default function Experience() {
  const currentPoint = useStore((state) => state.currentPoint)
  const setCurrentPoint = useStore((state) => state.setCurrentPoint)
  const markPointVisited = useStore((state) => state.markPointVisited)
  const scenePoints = useStore((state) => state.scenePoints)
  const isEditMode = useAdminStore((state) => state.isEditMode)
  
  const controlsRef = useRef<any>(null)
  
  // 每帧更新玩家位置并检测触发器
  useFrame(() => {
    if (controlsRef.current) {
      const camera = controlsRef.current.getObject()
      const newPosition = new Vector3(
        camera.position.x,
        camera.position.y,
        camera.position.z
      )
      
      // 检测是否在任何场景点附近
      let inTriggerZone = false
      for (const point of scenePoints) {
        const distance = newPosition.distanceTo(point.position)
        if (distance <= point.radius) {
          inTriggerZone = true
          if (currentPoint?.id !== point.id) {
            setCurrentPoint(point)
            if (!point.visited) {
              markPointVisited(point.id)
            }
          }
          break
        }
      }
      
      // 如果不在任何触发区域，清除当前点
      if (!inTriggerZone && currentPoint) {
        setCurrentPoint(null)
      }
    }
  })
  
  return (
    <>
      {/* 控制器切换：编辑模式 vs 游客模式 */}
      {isEditMode ? (
        <>
          <EditorControls />
          <ModelPlacementHelper />
        </>
      ) : (
        <FirstPersonControls ref={controlsRef} />
      )}
      
      {/* 场景环境（地面、文物等） */}
      <SceneEnvironment />
      
      {/* 触发区域可视化（开发时） */}
      {import.meta.env.DEV && <TriggerZones />}
    </>
  )
}
