// 第一人称控制器组件
// 用于处理用户在场景中的移动和交互
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { Vector3 } from 'three'
import { useStore } from '../store/useStore'

const FirstPersonControls = forwardRef((_props, ref) => {
  const { camera, gl } = useThree()
  const controlsRef = useRef<PointerLockControls | null>(null)
  const playerPosition = useStore((state) => state.playerPosition)
  const setPlayerPosition = useStore((state) => state.setPlayerPosition)
  const setPointerLocked = useStore((state) => state.setPointerLocked)
  const setShowInstructions = useStore((state) => state.setShowInstructions)
  const scenePoints = useStore((state) => state.scenePoints)
  const groundBounds = useStore((state) => state.groundBounds)
  
  // 移动状态
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    canJump: true,
  })
  
  // 速度和重力
  const velocity = useRef(new Vector3())
  const direction = useRef(new Vector3())
  const MOVE_SPEED = 12.0
  const JUMP_VELOCITY = 10.0 // 增加跳跃高度
  const GRAVITY = -7.5 // 稍微减小重力，使跳跃感觉更轻盈
  const GROUND_HEIGHT = 1.6
  
  useEffect(() => {
    const controls = new PointerLockControls(camera, gl.domElement)
    controlsRef.current = controls
    
    // 点击开始控制
    const handleClick = () => {
      controls.lock()
    }
    
    gl.domElement.addEventListener('click', handleClick)
    
    // 监听锁定状态
    controls.addEventListener('lock', () => {
      setPointerLocked(true)
      setShowInstructions(false)
    })
    
    controls.addEventListener('unlock', () => {
      setPointerLocked(false)
    })
    
    // 键盘事件
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveState.current.forward = true
          break
        case 'KeyS':
        case 'ArrowDown':
          moveState.current.backward = true
          break
        case 'KeyA':
        case 'ArrowLeft':
          moveState.current.left = true
          break
        case 'KeyD':
        case 'ArrowRight':
          moveState.current.right = true
          break
        case 'Space':
          // 仅在指针锁定时允许跳跃，避免输入框等占用空格键
          if (controlsRef.current?.isLocked) {
            event.preventDefault()
            if (moveState.current.canJump) {
              velocity.current.y = JUMP_VELOCITY
              moveState.current.canJump = false
            }
          }
          break
      }
    }
    
    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveState.current.forward = false
          break
        case 'KeyS':
        case 'ArrowDown':
          moveState.current.backward = false
          break
        case 'KeyA':
        case 'ArrowLeft':
          moveState.current.left = false
          break
        case 'KeyD':
        case 'ArrowRight':
          moveState.current.right = false
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    return () => {
      gl.domElement.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      controls.dispose()
    }
  }, [camera, gl, setPointerLocked, setShowInstructions])
  
  // 暴露控制器引用给父组件
  useImperativeHandle(ref, () => controlsRef.current)
  
  // 监听玩家位置变化（用于场景切换时的位置重置）
  useEffect(() => {
    if (camera && playerPosition && controlsRef.current) {
      
      const newPosition = playerPosition.clone()
      camera.position.copy(newPosition)
      velocity.current.set(0, 0, 0) // 重置速度
      
      // 确保相机位置更新到 controls
      controlsRef.current.getObject().position.copy(newPosition)
    }
  }, [playerPosition, camera])

  // 碰撞检测辅助函数
  const checkCollision = (newPos: Vector3) => {
    const playerRadius = 0.5 // 玩家碰撞半径
    
    // 只检查与模型的碰撞，允许玩家在场景中自由移动
    for (const point of scenePoints) {
      // 检查是否有自定义碰撞半径
      let collisionRadius: number
      
      if (point.collisionRadius === 0) {
        // collisionRadius 为 0，表示无碰撞，可穿过
        continue
      } else if (point.collisionRadius !== undefined) {
        // 使用自定义碰撞半径
        collisionRadius = point.collisionRadius
      } else {
        // 自动计算碰撞半径（默认行为）
        const scale = point.scale || 1
        const scaleValue = typeof scale === 'number' ? scale : Math.max(...(scale as number[]))
        collisionRadius = Math.max(scaleValue * 1.2, 1.5) // 根据模型缩放动态调整，最小1.5米
      }
      
      const dx = newPos.x - point.position.x
      const dz = newPos.z - point.position.z
      const distance = Math.sqrt(dx * dx + dz * dz)
      
      if (distance < collisionRadius + playerRadius) {
        return true // 发生碰撞
      }
    }
    
    return false // 无碰撞
  }

  // 每帧更新移动
  const lastUpdate = useRef(0)
  useFrame((state, delta) => {
    if (!controlsRef.current || !controlsRef.current.isLocked) return
    const controls = controlsRef.current
    
    const ms = moveState.current
    
    // 应用重力
    velocity.current.y += GRAVITY * delta
    
    // 移动方向
    direction.current.z = Number(ms.forward) - Number(ms.backward)
    direction.current.x = Number(ms.right) - Number(ms.left)
    direction.current.normalize()
    
    // 水平移动
    if (ms.forward || ms.backward) {
      velocity.current.z = -direction.current.z * MOVE_SPEED * delta
    } else {
      velocity.current.z = 0
    }
    
    if (ms.left || ms.right) {
      velocity.current.x = -direction.current.x * MOVE_SPEED * delta
    } else {
      velocity.current.x = 0
    }
    
    // 保存当前位置
    const currentPos = controls.getObject().position.clone()
    
    // 尝试应用移动
    controls.moveForward(-velocity.current.z)
    controls.moveRight(-velocity.current.x)
    
    // 获取新位置
    const newPos = controls.getObject().position.clone()

    // 边界约束（来自动态地面计算）
    if (groundBounds) {
      const clamped = new Vector3(
        Math.min(Math.max(newPos.x, groundBounds.minX), groundBounds.maxX),
        newPos.y,
        Math.min(Math.max(newPos.z, groundBounds.minZ), groundBounds.maxZ)
      )
      newPos.copy(clamped)
      controls.getObject().position.copy(clamped)
      camera.position.copy(clamped)
    }
    
    // 检查碰撞
    if (checkCollision(newPos)) {
      // 发生碰撞，恢复到之前的位置
      controls.getObject().position.copy(currentPos)
      camera.position.copy(currentPos)
    }
    
    // 垂直移动和碰撞检测
    camera.position.y += velocity.current.y * delta
    
    // 地面碰撞
    if (camera.position.y <= GROUND_HEIGHT) {
      camera.position.y = GROUND_HEIGHT
      velocity.current.y = 0
      ms.canJump = true
    }
    
    // 更新商店中的玩家位置（节流以避免过于频繁）
    if (!state.clock.running) return
    const currentTime = state.clock.elapsedTime * 1000
    if (currentTime - lastUpdate.current > 120) {
      const currentPos = controls.getObject().position.clone()
      setPlayerPosition(currentPos)
      lastUpdate.current = currentTime
    }
  })
  
  return null
})

FirstPersonControls.displayName = 'FirstPersonControls'

export default FirstPersonControls
