import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Box, Sphere, Cylinder, useGLTF, TransformControls } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { useAdminStore } from '../store/useAdminStore'
import { useTransformMode } from './Admin/EditorToolbar'
import * as THREE from 'three'

export default function SceneEnvironment() {
  const scenePoints = useStore((state) => state.scenePoints)
  
  return (
    <group>
      {/* 地面 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color="#2d3748"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      {/* 网格辅助线 */}
      <gridHelper args={[100, 50, '#4a5568', '#2d3748']} />
      
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
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const currentPoint = useStore((state) => state.currentPoint)
  const isActive = currentPoint?.id === point.id
  
  const isEditMode = useAdminStore((s) => s.isEditMode)
  const selectedPointId = useStore((s) => s.selectedPointId)
  const setSelectedPoint = useStore((s) => s.setSelectedPoint)
  const updateScenePoint = useStore((s) => s.updateScenePoint)
  const transformMode = useTransformMode()
  
  const isSelected = selectedPointId === point.id
  const [isDragging, setIsDragging] = useState(false)
  
  // 旋转动画（编辑模式下禁用）
  useFrame((state, delta) => {
    if (!isEditMode && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
    }
  })
  
  // 点击选择（仅编辑模式）
  const handleClick = (e: any) => {
    if (!isEditMode) return
    e.stopPropagation()
    setSelectedPoint(point.id)
  }
  
  // TransformControls 变化时更新位置
  const handleTransformChange = () => {
    if (!groupRef.current || !isEditMode || !isSelected) return
    const pos = groupRef.current.position
    updateScenePoint(point.id, {
      position: new THREE.Vector3(pos.x, pos.y, pos.z),
    })
  }
  
  // 如果存在模型路径，优先渲染 GLTF/GLB 模型
  if (point.modelPath) {
    return (
      <>
        <group ref={groupRef} position={[point.position.x, point.position.y || 0, point.position.z]} onClick={handleClick}>
          <ModelObject url={point.modelPath} highlight={isActive || isSelected} name={point.name} />
          {/* 标签 */}
          <Text
            position={[0, 2, 0]}
            fontSize={0.3}
            color={isActive || isSelected ? '#FFD700' : '#ffffff'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {point.name}
          </Text>
        </group>
        
        {/* TransformControls（仅编辑模式且选中时） */}
        {isEditMode && isSelected && groupRef.current && (
          <TransformControls
            object={groupRef.current}
            mode={transformMode}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => {
              setIsDragging(false)
              handleTransformChange()
            }}
          />
        )}
      </>
    )
  }

  // 根据不同类型显示不同的几何体（模拟文物）
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
          <Sphere ref={meshRef} args={[1, 32, 32]} castShadow>
            <meshStandardMaterial color="#ffd700" />
          </Sphere>
        )
    }
  }
  
  return (
    <>
      <group ref={groupRef} position={[point.position.x, 1.5, point.position.z]} onClick={handleClick}>
        {/* 文物模型 */}
        {getArtifactGeometry()}
        
        {/* 底座 */}
        <Cylinder
          args={[1.5, 1.5, 0.3, 32]}
          position={[0, -1.35, 0]}
          castShadow
        >
          <meshStandardMaterial
            color={isActive || isSelected ? '#FFD700' : '#4a5568'}
            roughness={0.5}
            metalness={0.5}
            emissive={isActive || isSelected ? '#FFD700' : '#000000'}
            emissiveIntensity={isActive || isSelected ? 0.2 : 0}
          />
        </Cylinder>
        
        {/* 标签 */}
        <Text
          position={[0, 2, 0]}
          fontSize={0.3}
          color={isActive || isSelected ? '#FFD700' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {point.name}
        </Text>
        
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
          object={groupRef.current}
          mode={transformMode}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => {
            setIsDragging(false)
            handleTransformChange()
          }}
        />
      )}
    </>
  )
}

// 加载 GLTF/GLB 模型（性能优化版本）
function ModelObject({ url, highlight, name }: { url: string; highlight: boolean; name: string }) {
  const { scene } = useGLTF(url) as any
  const meshRef = useRef<THREE.Group>()
  
  // 仅在高亮变化时更新材质（性能优化）
  useEffect(() => {
    if (!meshRef.current) return
    
    meshRef.current.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        obj.castShadow = true
        obj.receiveShadow = true
        if (obj.material.emissive) {
          obj.material.emissive = new THREE.Color(highlight ? '#FFD700' : '#000000')
          obj.material.emissiveIntensity = highlight ? 0.15 : 0
          obj.material.needsUpdate = true
        }
      }
    })
  }, [highlight])
  
  // 克隆场景以支持多实例（性能优化：复用几何体）
  const clonedScene = useMemo(() => scene.clone(), [scene])
  
  const s = 1
  return <primitive ref={meshRef} object={clonedScene} scale={[s, s, s]} />
}

// 环境装饰
function EnvironmentDecoration() {
  return (
    <group>
      {/* 一些装饰柱子 */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const radius = 15
        return (
          <Cylinder
            key={i}
            args={[0.3, 0.3, 5, 8]}
            position={[
              Math.cos(angle) * radius,
              2.5,
              Math.sin(angle) * radius,
            ]}
            castShadow
          >
            <meshStandardMaterial
              color="#8b4513"
              roughness={0.7}
              metalness={0.1}
            />
          </Cylinder>
        )
      })}
    </group>
  )
}
