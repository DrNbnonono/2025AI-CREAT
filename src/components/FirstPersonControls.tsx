import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { Vector3 } from 'three'
import { useStore } from '../store/useStore'

const FirstPersonControls = forwardRef((props, ref) => {
  const { camera, gl } = useThree()
  const controlsRef = useRef<PointerLockControls | null>(null)
  const playerPosition = useStore((state) => state.playerPosition)
  const setPlayerPosition = useStore((state) => state.setPlayerPosition)
  const setPointerLocked = useStore((state) => state.setPointerLocked)
  const setShowInstructions = useStore((state) => state.setShowInstructions)
  
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
  const MOVE_SPEED = 10.0
  const JUMP_VELOCITY = 5.0
  const GRAVITY = -9.8
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
      console.log('🔄 重置玩家位置:', playerPosition)
      const newPosition = playerPosition.clone()
      camera.position.copy(newPosition)
      velocity.current.set(0, 0, 0) // 重置速度
      
      // 确保相机位置更新到 controls
      controlsRef.current.getObject().position.copy(newPosition)
    }
  }, [playerPosition, camera])

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
    
    // 应用移动
    controls.moveForward(-velocity.current.z)
    controls.moveRight(-velocity.current.x)
    
    // 垂直移动和碰撞检测
    camera.position.y += velocity.current.y * delta
    
    // 地面碰撞
    if (camera.position.y <= GROUND_HEIGHT) {
      camera.position.y = GROUND_HEIGHT
      velocity.current.y = 0
      ms.canJump = true
    }
    
    // 更新商店中的玩家位置（每 100ms 更新一次以避免过于频繁）
    const currentTime = Date.now()
    if (currentTime - lastUpdate.current > 100) {
      const currentPos = controls.getObject().position.clone()
      setPlayerPosition(currentPos)
      lastUpdate.current = currentTime
    }
  })
  
  return null
})

FirstPersonControls.displayName = 'FirstPersonControls'

export default FirstPersonControls
