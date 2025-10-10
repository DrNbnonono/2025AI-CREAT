import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js'

interface UniversalModelLoaderProps {
  url: string
  highlight?: boolean
  name?: string
  onLoad?: (object: THREE.Object3D) => void
  onError?: (error: Error) => void
}

/**
 * 通用模型加载器
 * 支持格式：.glb, .gltf, .fbx, .obj, .dae (Collada)
 * 对于 .skp 文件，显示转换提示
 */
export default function UniversalModelLoader({ 
  url, 
  highlight = false,
  onLoad,
  onError 
}: UniversalModelLoaderProps) {
  const [model, setModel] = useState<THREE.Object3D | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const meshRef = useRef<THREE.Group>(null)
  
  const fileExtension = useMemo(() => {
    const ext = url.toLowerCase().split('.').pop() || ''
    return ext
  }, [url])

  // 处理高亮效果
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

  // 加载模型
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    // SKP 格式特殊处理
    if (fileExtension === 'skp') {
      setError('skp-convert-needed')
      setIsLoading(false)
      return
    }

    // GLB/GLTF 格式使用 useGLTF（在组件外部）
    if (fileExtension === 'glb' || fileExtension === 'gltf') {
      // 这个会在 GLTFModelLoader 组件中处理
      return
    }

    const loadModel = async () => {
      try {
        let loadedModel: THREE.Object3D | null = null

        if (fileExtension === 'fbx') {
          // 加载 FBX
          const loader = new FBXLoader()
          loadedModel = await new Promise<THREE.Group>((resolve, reject) => {
            loader.load(
              url,
              (object) => resolve(object),
              undefined,
              (err) => reject(err)
            )
          })
        } else if (fileExtension === 'obj') {
          // 加载 OBJ
          const loader = new OBJLoader()
          loadedModel = await new Promise<THREE.Group>((resolve, reject) => {
            loader.load(
              url,
              (object) => resolve(object),
              undefined,
              (err) => reject(err)
            )
          })
        } else if (fileExtension === 'dae') {
          // 加载 Collada (DAE) - SketchUp 常用导出格式
          const loader = new ColladaLoader()
          const result = await new Promise<any>((resolve, reject) => {
            loader.load(
              url,
              (collada) => resolve(collada),
              undefined,
              (err) => reject(err)
            )
          })
          loadedModel = result.scene
        } else {
          throw new Error(`不支持的文件格式: .${fileExtension}`)
        }

        if (!cancelled && loadedModel) {
          setModel(loadedModel)
          setIsLoading(false)
          onLoad?.(loadedModel)
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error(`加载模型失败 (${url}):`, err)
          setError(err.message || '加载失败')
          setIsLoading(false)
          onError?.(err)
        }
      }
    }

    loadModel()

    return () => {
      cancelled = true
    }
  }, [url, fileExtension, onLoad, onError])

  // GLB/GLTF 使用专门的组件
  if (fileExtension === 'glb' || fileExtension === 'gltf') {
    return <GLTFModelLoader url={url} highlight={highlight} />
  }

  // SKP 转换提示
  if (error === 'skp-convert-needed') {
    return (
      <group>
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#ff6b6b" />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <Html center>
            <div
              style={{
                background: 'rgba(255, 107, 107, 0.95)',
                color: 'white',
                padding: '16px 20px',
                borderRadius: '12px',
                fontSize: '14px',
                maxWidth: '280px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📦</div>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                .SKP 格式需要转换
              </div>
              <div style={{ fontSize: '12px', marginBottom: '12px', opacity: 0.9 }}>
                SketchUp 文件需要转换为 GLB/GLTF 格式
              </div>
              <a
                href="https://products.aspose.app/3d/zh/conversion/skp-to-gltf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: 'white',
                  color: '#ff6b6b',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginTop: '4px',
                }}
              >
                在线转换工具 →
              </a>
            </div>
          </Html>
        </mesh>
      </group>
    )
  }

  // 其他错误
  if (error) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#ff6b6b" wireframe />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <Html center>
            <div
              style={{
                background: 'rgba(255, 107, 107, 0.9)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                maxWidth: '200px',
              }}
            >
              ⚠️ 加载失败<br />
              <span style={{ fontSize: '10px', opacity: 0.8 }}>{error}</span>
            </div>
          </Html>
        </mesh>
      </group>
    )
  }

  // 加载中
  if (isLoading) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#4299e1" transparent opacity={0.5} />
        </mesh>
      </group>
    )
  }

  // 渲染加载的模型
  if (model) {
    const clonedModel = useMemo(() => model.clone(), [model])
    return <primitive ref={meshRef} object={clonedModel} />
  }

  return null
}

// GLTF 专用加载器（使用 drei 的 useGLTF）
// 添加错误边界组件
class GLTFErrorBoundary extends React.Component<
  { children: React.ReactNode; url: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; url: string }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('GLTFModelLoader错误:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <group>
          <mesh>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshStandardMaterial color="#ff6b6b" wireframe />
          </mesh>
          <Html center>
            <div
              style={{
                background: 'rgba(255, 107, 107, 0.9)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                maxWidth: '200px',
                textAlign: 'center',
              }}
            >
              ⚠️ GLB加载失败<br />
              <span style={{ fontSize: '10px', opacity: 0.8 }}>
                {this.state.error?.message || '文件可能已损坏'}
              </span>
            </div>
          </Html>
        </group>
      )
    }

    return this.props.children
  }
}

function GLTFModelLoader({ url, highlight }: { url: string; highlight: boolean }) {
  return (
    <GLTFErrorBoundary url={url}>
      <GLTFModelContent url={url} highlight={highlight} />
    </GLTFErrorBoundary>
  )
}

function GLTFModelContent({ url, highlight }: { url: string; highlight: boolean }) {
  const gltf = useGLTF(url) as any
  const meshRef = useRef<THREE.Group>(null)

  // 处理高亮效果
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

  const clonedScene = useMemo(() => {
    if (!gltf?.scene) return null
    return gltf.scene.clone()
  }, [gltf])
  
  if (!clonedScene) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#gray" wireframe />
        </mesh>
      </group>
    )
  }
  
  return <primitive ref={meshRef} object={clonedScene} />
}
