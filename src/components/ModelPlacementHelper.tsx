import { useEffect, useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Raycaster, Vector2, Vector3, Mesh, PlaneGeometry, MeshBasicMaterial } from 'three'
import { useStore } from '../store/useStore'
import { useAdminStore } from '../store/useAdminStore'

/**
 * 模型放置辅助工具
 * - 鼠标移动显示预览位置
 * - 点击放置模型
 */
export default function ModelPlacementHelper() {
  const { camera, gl, scene } = useThree()
  const isEditMode = useAdminStore((s) => s.isEditMode)
  const placingModelPath = useStore((s) => s.placingModelPath)
  const selectedPointId = useStore((s) => s.selectedPointId)
  const addScenePoint = useStore((s) => s.addScenePoint)
  const setSelectedPoint = useStore((s) => s.setSelectedPoint)
  const setPlacingModelPath = useStore((s) => s.setPlacingModelPath)
  
  const raycasterRef = useRef(new Raycaster())
  const mouseRef = useRef(new Vector2())
  const [previewPos, setPreviewPos] = useState<Vector3 | null>(null)
  const previewMeshRef = useRef<Mesh | null>(null)
  
  // 选中模型时禁用放置
  const isPlacingDisabled = !!selectedPointId

  useEffect(() => {
    if (!isEditMode || !placingModelPath || isPlacingDisabled) {
      // 移除预览网格
      if (previewMeshRef.current) {
        scene.remove(previewMeshRef.current)
        previewMeshRef.current.geometry.dispose()
        ;(previewMeshRef.current.material as MeshBasicMaterial).dispose()
        previewMeshRef.current = null
      }
      setPreviewPos(null)
      return
    }
    
    // 创建预览网格（半透明圆盘）
    const geometry = new PlaneGeometry(2, 2)
    geometry.rotateX(-Math.PI / 2)
    const material = new MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    })
    const mesh = new Mesh(geometry, material)
    mesh.position.y = 0.05 // 略高于地面避免z-fighting
    scene.add(mesh)
    previewMeshRef.current = mesh
    
    return () => {
      if (previewMeshRef.current) {
        scene.remove(previewMeshRef.current)
        previewMeshRef.current.geometry.dispose()
        ;(previewMeshRef.current.material as MeshBasicMaterial).dispose()
        previewMeshRef.current = null
      }
    }
  }, [isEditMode, placingModelPath, isPlacingDisabled, scene])
  
  useEffect(() => {
    if (!isEditMode || !placingModelPath || isPlacingDisabled) return
    
    const handleMouseMove = (e: MouseEvent) => {
      // 归一化鼠标坐标
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    
    const handleClick = (e: MouseEvent) => {
      // 只处理左键点击
      if (e.button !== 0) return
      
      // 避免点击UI时触发
      const target = e.target as HTMLElement
      if (target.tagName !== 'CANVAS') return
      
      if (!previewPos) return
      
      // 在点击位置生成模型
      const id = `obj-${Date.now()}`
      
      // 从模型路径生成友好的默认名称
      const getModelDisplayName = (path: string): string => {
        const filename = path.split('/').slice(-1)[0] || '模型'
        // 移除文件扩展名
        const nameWithoutExt = filename.replace(/\.(glb|gltf|fbx|obj|dae|skp)$/i, '')
        // 将下划线和连字符替换为空格，并处理驼峰命名
        const friendlyName = nameWithoutExt
          .replace(/[_-]/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2') // 驼峰转空格
          .trim()
        return friendlyName || '模型'
      }
      
      addScenePoint({
        id,
        name: getModelDisplayName(placingModelPath),
        position: previewPos.clone(),
        radius: 2.5,
        description: '自定义模型',
        aiContext: '这是一个自定义导入的模型。',
        modelPath: placingModelPath,
      })
      setSelectedPoint(id)
      
      // 清除放置模式（可选：保持放置模式以连续放置）
      // setPlacingModelPath(null)
      
      console.log('✅ 模型已放置:', id, previewPos)
    }
    
    gl.domElement.addEventListener('mousemove', handleMouseMove)
    gl.domElement.addEventListener('click', handleClick)
    
    return () => {
      gl.domElement.removeEventListener('mousemove', handleMouseMove)
      gl.domElement.removeEventListener('click', handleClick)
    }
  }, [isEditMode, placingModelPath, isPlacingDisabled, previewPos, gl, addScenePoint, setSelectedPoint, setPlacingModelPath])
  
  useFrame(() => {
    if (!isEditMode || !placingModelPath || isPlacingDisabled || !previewMeshRef.current) return
    
    const raycaster = raycasterRef.current
    raycaster.setFromCamera(mouseRef.current, camera)
    
    // 与地面（y=0）求交点
    const groundPlane = new Vector3(0, 1, 0)
    const planePoint = new Vector3(0, 0, 0)
    const ray = raycaster.ray
    
    const denominator = groundPlane.dot(ray.direction)
    if (Math.abs(denominator) > 1e-6) {
      const t = planePoint.clone().sub(ray.origin).dot(groundPlane) / denominator
      if (t >= 0) {
        const intersectPoint = ray.origin.clone().add(ray.direction.multiplyScalar(t))
        setPreviewPos(intersectPoint)
        previewMeshRef.current.position.set(intersectPoint.x, 0.05, intersectPoint.z)
        previewMeshRef.current.visible = true
        return
      }
    }
    
    previewMeshRef.current.visible = false
  })
  
  return null
}

