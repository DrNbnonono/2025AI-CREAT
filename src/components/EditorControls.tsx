import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Vector3 } from 'three'
import { useAdminStore } from '../store/useAdminStore'

/**
 * 编辑器模式控制器（类似Blender）
 * - 滚轮缩放
 * - 右键拖拽平移
 * - 左键拖拽旋转
 * - WASD键盘移动
 */
export default function EditorControls() {
  const { camera, gl } = useThree()
  const controlsRef = useRef<OrbitControls | null>(null)
  const isUiInteracting = useAdminStore((state) => state.isUiInteracting)
  
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  })
  
  const MOVE_SPEED = 15.0
  
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement)
    controlsRef.current = controls
    
    // 配置类似Blender的控制
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.screenSpacePanning = true
    controls.minDistance = 1
    controls.maxDistance = 500
    controls.maxPolarAngle = Math.PI // 允许从下方观察
    
    // 鼠标按钮配置
    controls.mouseButtons = {
      LEFT: 2,   // 左键旋转（THREE.MOUSE.ROTATE）
      MIDDLE: 1, // 中键平移（THREE.MOUSE.DOLLY）
      RIGHT: 0,  // 右键平移（THREE.MOUSE.PAN）
    }
    
    return () => {
      controls.dispose()
    }
  }, [camera, gl])
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isUiInteracting) return
      switch (e.code) {
        case 'KeyW': moveState.current.forward = true; break
        case 'KeyS': moveState.current.backward = true; break
        case 'KeyA': moveState.current.left = true; break
        case 'KeyD': moveState.current.right = true; break
        case 'KeyQ': moveState.current.down = true; break
        case 'KeyE': moveState.current.up = true; break
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (isUiInteracting) return
      switch (e.code) {
        case 'KeyW': moveState.current.forward = false; break
        case 'KeyS': moveState.current.backward = false; break
        case 'KeyA': moveState.current.left = false; break
        case 'KeyD': moveState.current.right = false; break
        case 'KeyQ': moveState.current.down = false; break
        case 'KeyE': moveState.current.up = false; break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [isUiInteracting])
  
  useFrame((state, delta) => {
    if (!controlsRef.current) return
    
    const controls = controlsRef.current
    const ms = moveState.current
    
    // WASD键盘移动（相对于当前视角）
    const direction = new Vector3()
    const right = new Vector3()
    
    // 获取相机朝向和右向量
    camera.getWorldDirection(direction)
    right.crossVectors(camera.up, direction).normalize()
    
    const moveVector = new Vector3()
    
    if (ms.forward) moveVector.add(direction.multiplyScalar(MOVE_SPEED * delta))
    if (ms.backward) moveVector.add(direction.multiplyScalar(-MOVE_SPEED * delta))
    if (ms.left) moveVector.add(right.multiplyScalar(MOVE_SPEED * delta))
    if (ms.right) moveVector.add(right.multiplyScalar(-MOVE_SPEED * delta))
    if (ms.up) moveVector.y += MOVE_SPEED * delta
    if (ms.down) moveVector.y -= MOVE_SPEED * delta
    
    if (moveVector.length() > 0) {
      camera.position.add(moveVector)
      controls.target.add(moveVector)
    }
    
    controls.update()
  })
  
  return null
}

