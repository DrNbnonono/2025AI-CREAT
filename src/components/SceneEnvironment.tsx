// 场景环境组件
// 包含场景中的所有静态元素，如地面、环境光、模型等
import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Sphere, Cylinder, TransformControls, Html, useGLTF } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { useAdminStore } from '../store/useAdminStore'
import { useTransformMode } from './Admin/EditorToolbar'
import UniversalModelLoader from './UniversalModelLoader'
import { timeOfDayService, TimeOfDay } from '../services/timeOfDayService'
import * as THREE from 'three'

// 创建程序化石砖纹理（使用缓存优化性能）
const createBrickTexture = (() => {
  let cachedTexture: THREE.Texture | null = null
  let cacheKey = ''

  return function createBrickTexture() {
    // 检查缓存是否有效（首次渲染或SSR环境下）
    if (typeof window === 'undefined') {
      return new THREE.Texture()
    }

    // 如果已经创建过纹理，直接返回缓存
    if (cachedTexture) {
      return cachedTexture
    }

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) return new THREE.Texture()

    // 底色
    ctx.fillStyle = '#6B5D52'
    ctx.fillRect(0, 0, 512, 512)

    // 绘制石砖
    const brickWidth = 128
    const brickHeight = 64
    const mortarSize = 4

    ctx.strokeStyle = '#4A4035'
    ctx.lineWidth = mortarSize

    for (let y = 0; y < 512; y += brickHeight) {
      for (let x = 0; x < 512; x += brickWidth) {
        const offsetX = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2
        ctx.strokeRect(x + offsetX, y, brickWidth, brickHeight)

        // 添加纹理细节
        ctx.fillStyle = `rgba(${100 + Math.random() * 30}, ${80 + Math.random() * 20}, ${70 + Math.random() * 20}, 0.3)`
        ctx.fillRect(x + offsetX + mortarSize, y + mortarSize, brickWidth - mortarSize * 2, brickHeight - mortarSize * 2)
      }
    }

    cachedTexture = new THREE.CanvasTexture(canvas)
    cachedTexture.wrapS = THREE.RepeatWrapping
    cachedTexture.wrapT = THREE.RepeatWrapping
    cachedTexture.repeat.set(4, 4)
    return cachedTexture
  }
})()

export default function SceneEnvironment() {
  const scenePoints = useStore((state) => state.scenePoints)
  const setGroundBounds = useStore((state) => state.setGroundBounds)

  // 动态计算场地大小
  const calculateGroundSize = () => {
    if (scenePoints.length === 0) return {
      size: 100,
      position: [0, 0] as [number, number],
      bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 }
    }

    let minX = Infinity, maxX = -Infinity
    let minZ = Infinity, maxZ = -Infinity

    scenePoints.forEach(point => {
      const x = point.position.x
      const z = point.position.z
      const scale = point.scale || 1
      const scaleValue = typeof scale === 'number' ? scale : Math.max(...(scale as number[]))
      const radius = Math.max(point.radius || 3, scaleValue * 3)

      minX = Math.min(minX, x - radius)
      maxX = Math.max(maxX, x + radius)
      minZ = Math.min(minZ, z - radius)
      maxZ = Math.max(maxZ, z + radius)
    })

    // 添加边距
    const padding = 20
    const width = Math.max(100, maxX - minX + padding * 2)
    const depth = Math.max(100, maxZ - minZ + padding * 2)
    const size = Math.max(width, depth)

    const centerX = (minX + maxX) / 2
    const centerZ = (minZ + maxZ) / 2

    // 计算实际边界（用于碰撞检测）
    const halfSize = size / 2
    const bounds = {
      minX: centerX - halfSize + 5,
      maxX: centerX + halfSize - 5,
      minZ: centerZ - halfSize + 5,
      maxZ: centerZ + halfSize - 5
    }

    return {
      size: Math.ceil(size / 10) * 10,
      position: [centerX, centerZ] as [number, number],
      bounds
    }
  }

  const groundConfig = calculateGroundSize()

  // 更新碰撞边界到 store
  useEffect(() => {
    setGroundBounds(groundConfig.bounds)
  }, [scenePoints, setGroundBounds])

  // 预加载当前场景中的 GLTF/GLB 模型，降低首次进入延迟
  useEffect(() => {
    scenePoints.forEach((p) => {
      const url = p.modelPath
      if (!url) return
      const lower = url.toLowerCase()
      if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
        try {
          useGLTF.preload(url)
        } catch {}
      }
    })
  }, [scenePoints])

  return (
    <group>
      {/* 地面 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[groundConfig.position[0], 0, groundConfig.position[1]]}
        receiveShadow
      >
        <planeGeometry args={[groundConfig.size, groundConfig.size]} />
        <meshStandardMaterial
          color="#2d3748"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* 网格辅助线 */}
      <gridHelper
        args={[groundConfig.size, Math.floor(groundConfig.size / 2), '#4a5568', '#2d3748']}
        position={[groundConfig.position[0], 0, groundConfig.position[1]]}
      />

      {/* 场景点位的文物展示 */}
      {scenePoints.map((point) => (
        <ArtifactDisplay key={point.id} point={point} />
      ))}

      {/* 环境装饰 */}
      <EnvironmentDecoration />
    </group>
  )
}

// 文物展示组件
function ArtifactDisplay({ point }: { point: any }) {
  const groupRef = useRef<THREE.Group | null>(null)
  const meshRef = useRef<THREE.Group>(null)
  const currentPoint = useStore((state) => state.currentPoint)
  const isActive = currentPoint?.id === point.id

  const isEditMode = useAdminStore((s) => s.isEditMode)
  const selectedPointId = useStore((s) => s.selectedPointId)
  const setSelectedPoint = useStore((s) => s.setSelectedPoint)
  const updateScenePoint = useStore((s) => s.updateScenePoint)
  const transformMode = useTransformMode()

  const isSelected = selectedPointId === point.id

  // 旋转动画（编辑模式下禁用）
  useFrame((_state, delta) => {
    if (!isEditMode && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  const handleClick = (e: any) => {
    if (!isEditMode) return
    e.stopPropagation()
    setSelectedPoint(point.id)
  }

  const handleTransformChange = () => {
    if (!groupRef.current || !isEditMode || !isSelected) return
    const { position, rotation, scale } = groupRef.current
    updateScenePoint(point.id, {
      position: new THREE.Vector3(position.x, position.y, position.z),
      rotation: new THREE.Vector3(rotation.x, rotation.y, rotation.z),
      scale: Array.isArray(scale)
        ? (scale as any).x ?? 1
        : scale instanceof THREE.Vector3
          ? scale.x
          : typeof scale === 'number'
            ? scale
            : 1,
    })
  }

  const groupPosition: [number, number, number] = [point.position.x, point.position.y ?? 0, point.position.z]
  const groupRotation: [number, number, number] = [
    point.rotation?.x ?? 0,
    point.rotation?.y ?? 0,
    point.rotation?.z ?? 0,
  ]
  const groupScale: number | [number, number, number] = point.scale != null
    ? Array.isArray(point.scale)
      ? point.scale
      : point.scale
    : 1

  // 计算平台尺寸（根据模型scale调整）
  const scaleValue = typeof groupScale === 'number' ? groupScale : Math.max(...groupScale)
  const platformSize = Math.max(2, scaleValue * 2.5)

  if (point.modelPath) {
    return (
      <>
        <group
          ref={groupRef}
          position={groupPosition}
          rotation={groupRotation}
          scale={groupScale}
          onClick={handleClick}
        >
          <UniversalModelLoader url={point.modelPath} highlight={isActive || isSelected} name={point.name} />
          <Html
            position={[0, 2, 0]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                background: isActive || isSelected ? 'rgba(255,215,0,0.9)' : 'rgba(0,0,0,0.6)',
                color: isActive || isSelected ? '#000' : '#fff',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              {point.name}
            </div>
          </Html>
        </group>

        {/* 石砖底座 - 根据模型大小调整 */}
        <mesh
          position={[groupPosition[0], groupPosition[1] - 0.15, groupPosition[2]]}
          receiveShadow
        >
          <boxGeometry args={[platformSize, 0.3, platformSize]} />
          <meshStandardMaterial
            color={isActive || isSelected ? '#8B7355' : '#6B5D52'}
            roughness={0.9}
            metalness={0.1}
            emissive={isActive || isSelected ? '#8B7355' : '#000000'}
            emissiveIntensity={isActive || isSelected ? 0.15 : 0}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          >
            <primitive attach="map" object={createBrickTexture()} />
          </meshStandardMaterial>
        </mesh>

      {isEditMode && isSelected && groupRef.current && (
        <TransformControls
          object={groupRef.current ?? undefined}
          mode={transformMode}
          onMouseUp={() => {
            handleTransformChange()
          }}
        />
      )}
      </>
    )
  }

  const getArtifactGeometry = () => {
    switch (point.id) {
      case 'bronze-vessel':
        return (
          <group ref={meshRef}>
            {/* 简化的青铜鼎 */}
            <Cylinder args={[1, 1.2, 1.5, 32]} castShadow>
              <meshStandardMaterial
                color="#8b7355"
                roughness={0.3}
                metalness={0.8}
              />
            </Cylinder>
            {/* 三足 */}
            {[0, 120, 240].map((angle, i) => {
              const rad = (angle * Math.PI) / 180
              return (
                <Cylinder
                  key={i}
                  args={[0.15, 0.1, 1, 8]}
                  position={[Math.cos(rad) * 0.9, -1.25, Math.sin(rad) * 0.9]}
                  castShadow
                >
                  <meshStandardMaterial
                    color="#8b7355"
                    roughness={0.3}
                    metalness={0.8}
                  />
                </Cylinder>
              )
            })}
          </group>
        )

      case 'silk-scroll':
        return (
          <group ref={meshRef}>
            {/* 卷轴 */}
            <Box args={[2, 1.5, 0.1]} castShadow>
              <meshStandardMaterial
                color="#f5deb3"
                roughness={0.6}
                metalness={0.1}
              />
            </Box>
            {/* 卷轴轴 */}
            <Cylinder
              args={[0.08, 0.08, 1.6, 16]}
              rotation={[0, 0, Math.PI / 2]}
              position={[1.1, 0, 0]}
              castShadow
            >
              <meshStandardMaterial color="#654321" />
            </Cylinder>
            <Cylinder
              args={[0.08, 0.08, 1.6, 16]}
              rotation={[0, 0, Math.PI / 2]}
              position={[-1.1, 0, 0]}
              castShadow
            >
              <meshStandardMaterial color="#654321" />
            </Cylinder>
          </group>
        )

      case 'jade-artifact':
        return (
          <group ref={meshRef}>
            {/* 玉璧（圆环） */}
            <mesh castShadow>
              <torusGeometry args={[1, 0.3, 16, 32]} />
              <meshStandardMaterial
                color="#90EE90"
                roughness={0.2}
                metalness={0.1}
                transparent
                opacity={0.9}
              />
            </mesh>
          </group>
        )

      default:
        return (
          <mesh castShadow>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="#ffd700" />
          </mesh>
        )
    }
  }

  return (
    <>
      <group
        ref={groupRef}
        position={groupPosition}
        rotation={groupRotation}
        scale={groupScale}
        onClick={handleClick}
      >
        {/* 文物模型 */}
        {getArtifactGeometry()}

        {/* 石砖底座 - 根据模型大小调整 */}
        <mesh
          position={[0, -1.35, 0]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[platformSize, 0.3, platformSize]} />
          <meshStandardMaterial
            color={isActive || isSelected ? '#8B7355' : '#6B5D52'}
            roughness={0.9}
            metalness={0.1}
            emissive={isActive || isSelected ? '#8B7355' : '#000000'}
            emissiveIntensity={isActive || isSelected ? 0.15 : 0}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          >
            <primitive attach="map" object={createBrickTexture()} />
          </meshStandardMaterial>
        </mesh>

        {/* 标签 */}
        <Html
          position={[0, 2, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              background: isActive || isSelected ? 'rgba(255,215,0,0.9)' : 'rgba(0,0,0,0.6)',
              color: isActive || isSelected ? '#000' : '#fff',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            {point.name}
          </div>
        </Html>

        {/* 访问标记 */}
        {point.visited && (
          <Sphere args={[0.15, 16, 16]} position={[0, 2.5, 0]}>
            <meshBasicMaterial color="#00ff00" />
          </Sphere>
        )}
      </group>

      {/* TransformControls（仅编辑模式且选中时） */}
      {isEditMode && isSelected && groupRef.current && (
        <TransformControls
          object={groupRef.current ?? undefined}
          mode={transformMode}
          onMouseUp={() => {
            handleTransformChange()
          }}
        />
      )}
    </>
  )
}

// 注意：ModelObject 已被 UniversalModelLoader 替代
// UniversalModelLoader 支持更多格式：.glb, .gltf, .fbx, .obj, .dae, .skp

// 环境装饰
function EnvironmentDecoration() {
  return null  // 移除装饰柱子
}
