import React, { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, useProgress } from '@react-three/drei'
import { Vector3 } from 'three'
import * as THREE from 'three'
import './ModelViewer.css'

interface ModelViewerProps {
  modelPath?: string | null
  name?: string
  className?: string
}

// 模型组件
function Model({ path, autoRotate, onToggleAutoRotate }: { path: string; autoRotate: boolean; onToggleAutoRotate: () => void }) {
  const { scene } = useGLTF(path)
  const modelRef = useRef<THREE.Group>(null)
  const [bbox, setBbox] = useState<{ center: Vector3; size: Vector3 } | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)

  useEffect(() => {
    if (scene && modelRef.current) {
      try {
        // 深拷贝场景，确保独立渲染
        const clonedScene = scene.clone(true)

        // 重置所有材质的发光效果，确保显示原始颜色
        clonedScene.traverse((obj: any) => {
          if (obj.isMesh && obj.material) {
            // 确保材质被正确克隆
            if (obj.material.isMaterial) {
              obj.material = obj.material.clone()
            }

            // 重置发光效果
            if (obj.material.emissive) {
              obj.material.emissive = new THREE.Color('#000000')
              obj.material.emissiveIntensity = 0
              obj.material.needsUpdate = true
            }

            // 启用阴影
            obj.castShadow = true
            obj.receiveShadow = true
          }
        })

        // 计算包围盒
        const box = new THREE.Box3().setFromObject(clonedScene)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        setBbox({ center, size })

        // 计算缩放因子，使模型适合查看
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2 / maxDim // 缩放到合适大小

        // 应用变换
        clonedScene.scale.setScalar(scale)
        clonedScene.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

        // 将克隆的场景应用到引用
        if (modelRef.current) {
          while (modelRef.current.children.length > 0) {
            modelRef.current.remove(modelRef.current.children[0])
          }
          modelRef.current.add(clonedScene)
        }

        setModelLoaded(true)
      } catch (error) {
        console.error('模型加载失败:', error)
        setModelLoaded(false)
      }
    }
  }, [scene])

  useFrame(() => {
    // 轻微的自动旋转动画
    if (modelRef.current && autoRotate && modelLoaded) {
      modelRef.current.rotation.y += 0.002
    }
  })

  return <group ref={modelRef} />
}

// 加载进度组件
function Loader() {
  const { progress } = useProgress()
  return (
    <div className="model-loader">
      <div className="loader-spinner"></div>
      <div className="loader-text">{Math.round(progress)}%</div>
    </div>
  )
}

// 相机控制器
function CameraController({ bbox }: { bbox: { center: Vector3; size: Vector3 } | null }) {
  const { camera } = useThree()

  useEffect(() => {
    if (bbox) {
      // 计算最佳相机位置 - 稍微偏离中心以获得更好的视角
      const maxDim = Math.max(bbox.size.x, bbox.size.y, bbox.size.z)
      const distance = maxDim * 2.5 // 增加距离以获得更好的视角
      const angle = Math.PI / 4 // 45度角

      // 计算更佳的相机位置：略高于模型中心，稍有偏移
      const centerX = bbox.center.x
      const centerY = bbox.center.y
      const centerZ = bbox.center.z

      camera.position.set(
        centerX + distance * Math.cos(angle) * 0.8,
        centerY + distance * 0.6, // 稍微抬高视角
        centerZ + distance * Math.sin(angle) * 0.8
      )

      camera.lookAt(centerX, centerY, centerZ)
    }
  }, [bbox, camera])

  return null
}

export default function ModelViewer({ modelPath, name, className = '' }: ModelViewerProps) {
  const [error, setError] = useState<string | null>(null)
  const [bbox, setBbox] = useState<{ center: Vector3; size: Vector3 } | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)

  const toggleAutoRotate = () => {
    setAutoRotate(!autoRotate)
  }

  if (!modelPath) {
    return (
      <div className={`model-viewer ${className}`}>
        <div className="model-placeholder">
          <div className="placeholder-icon">🎭</div>
          <div className="placeholder-text">当前未选择模型</div>
          <div className="placeholder-hint">进入场景点位以查看3D模型</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`model-viewer ${className}`}>
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        style={{ background: 'linear-gradient(180deg, rgba(40, 40, 48, 0.98) 0%, rgba(30, 30, 36, 0.98) 100%)' }}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#1a1a20')
        }}
      >
        {/* 环境光 - 提供基础照明 */}
        <ambientLight intensity={0.4} />

        {/* 主光源 - 右侧 */}
        <directionalLight
          position={[10, 10, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />

        {/* 辅助光源 - 左下角 */}
        <directionalLight
          position={[-8, 5, -8]}
          intensity={0.6}
        />

        {/* 顶部补光 */}
        <pointLight position={[0, 10, 0]} intensity={0.5} />

        <Suspense fallback={null}>
          <Model path={modelPath} autoRotate={autoRotate} onToggleAutoRotate={toggleAutoRotate} />
          <CameraController bbox={bbox} />
        </Suspense>

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={0.5}
          maxDistance={10}
          autoRotate={false}
          autoRotateSpeed={2}
          dampingFactor={0.05}
          enableDamping={true}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          panSpeed={0.8}
        />
      </Canvas>

      <div className="model-controls">
        <div className="model-name">{name || modelPath.split('/').pop()}</div>
        <button
          className={`model-rotate-button ${autoRotate ? 'active' : ''}`}
          onClick={toggleAutoRotate}
          title={autoRotate ? '停止自动旋转' : '开始自动旋转'}
        >
          {autoRotate ? '⏸️' : '▶️'}
        </button>
      </div>
    </div>
  )
}
