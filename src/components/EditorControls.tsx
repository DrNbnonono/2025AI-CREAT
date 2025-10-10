import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Vector3 } from 'three'
import { useAdminStore } from '../store/useAdminStore'

/**
 * 编辑器模式控制器（管理员专用）
 * - 滚轮缩放
 * - WASD 平移相机
 * - IJKL 旋转视角
 * - 禁用鼠标拖拽（鼠标仅用于选择和操作模型）
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
    rotateUp: false,
    rotateDown: false,
    rotateLeft: false,
    rotateRight: false,
  })
  
  const MOVE_SPEED = 15.0
  const ROTATE_SPEED = 1.5
  
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement)
    controlsRef.current = controls
    
    // 禁用所有鼠标控制，仅保留滚轮缩放
    controls.enableRotate = false  // 禁用鼠标旋转
    controls.enablePan = false     // 禁用鼠标平移
    controls.enableZoom = true     // 仅保留滚轮缩放
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 1
    controls.maxDistance = 500
    
    return () => {
      controls.dispose()
    }
  }, [camera, gl])
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isUiInteracting) return
      // 排除输入框
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.code) {
        // WASD 平移
        case 'KeyW': moveState.current.forward = true; break
        case 'KeyS': moveState.current.backward = true; break
        case 'KeyA': moveState.current.left = true; break
        case 'KeyD': moveState.current.right = true; break
        case 'KeyQ': moveState.current.down = true; break
        case 'KeyE': moveState.current.up = true; break
        
        // IJKL 旋转视角
        case 'KeyI': moveState.current.rotateUp = true; break
        case 'KeyK': moveState.current.rotateDown = true; break
        case 'KeyJ': moveState.current.rotateLeft = true; break
        case 'KeyL': moveState.current.rotateRight = true; break
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (isUiInteracting) return
      switch (e.code) {
        // WASD 平移
        case 'KeyW': moveState.current.forward = false; break
        case 'KeyS': moveState.current.backward = false; break
        case 'KeyA': moveState.current.left = false; break
        case 'KeyD': moveState.current.right = false; break
        case 'KeyQ': moveState.current.down = false; break
        case 'KeyE': moveState.current.up = false; break
        
        // IJKL 旋转视角
        case 'KeyI': moveState.current.rotateUp = false; break
        case 'KeyK': moveState.current.rotateDown = false; break
        case 'KeyJ': moveState.current.rotateLeft = false; break
        case 'KeyL': moveState.current.rotateRight = false; break
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
    
    // WASD 平移相机（相对于当前视角）
    const direction = new Vector3()
    const right = new Vector3()
    
    camera.getWorldDirection(direction)
    direction.y = 0 // 水平方向移动
    direction.normalize()
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
    
    // IJKL 旋转视角（围绕target旋转）
    const target = controls.target.clone()
    const offset = camera.position.clone().sub(target)
    
    // 计算球坐标
    const spherical = {
      radius: offset.length(),
      theta: Math.atan2(offset.x, offset.z),
      phi: Math.acos(Math.max(-1, Math.min(1, offset.y / offset.length())))
    }
    
    if (ms.rotateLeft) spherical.theta -= ROTATE_SPEED * delta
    if (ms.rotateRight) spherical.theta += ROTATE_SPEED * delta
    if (ms.rotateUp) spherical.phi = Math.max(0.1, spherical.phi - ROTATE_SPEED * delta)
    if (ms.rotateDown) spherical.phi = Math.min(Math.PI - 0.1, spherical.phi + ROTATE_SPEED * delta)
    
    // 转回笛卡尔坐标
    if (ms.rotateLeft || ms.rotateRight || ms.rotateUp || ms.rotateDown) {
      offset.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta)
      offset.y = spherical.radius * Math.cos(spherical.phi)
      offset.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
      camera.position.copy(target).add(offset)
    }
    
    controls.update()
  })
  
  return null
}

