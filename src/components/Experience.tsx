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
  const spatialIndexRef = useRef<Map<string, any[]>>(new Map())
  const cellSizeRef = useRef<number>(8)

  const cellKey = (x: number, z: number) => `${Math.floor(x / cellSizeRef.current)}:${Math.floor(z / cellSizeRef.current)}`

  useEffect(() => {
    const index = new Map<string, any[]>()
    const size = Math.max(6, ...scenePoints.map((p) => Math.max(3, p.radius)))
    cellSizeRef.current = Math.max(6, Math.min(12, size))
    for (const p of scenePoints) {
      const key = cellKey(p.position.x, p.position.z)
      const list = index.get(key) || []
      list.push(p)
      index.set(key, list)
    }
    spatialIndexRef.current = index
  }, [scenePoints])
  
  // 每帧更新玩家位置并检测触发器
  useFrame(() => {
    if (controlsRef.current) {
      const camera = controlsRef.current.getObject()
      const newPosition = new Vector3(
        camera.position.x,
        camera.position.y,
        camera.position.z
      )
      
      // 空间索引附近检测
      let inTriggerZone = false
      const baseKey = cellKey(newPosition.x, newPosition.z)
      const [cx, cz] = baseKey.split(':').map((v) => parseInt(v, 10))
      const candidates: any[] = []
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = `${cx + dx}:${cz + dz}`
          const list = spatialIndexRef.current.get(key)
          if (list) candidates.push(...list)
        }
      }
      for (const point of candidates.length ? candidates : scenePoints) {
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
      
      {/* 触发区域可视化（开发时或编辑模式下） */}
      <TriggerZones />
    </>
  )
}
