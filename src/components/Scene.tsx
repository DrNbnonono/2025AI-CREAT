import { Canvas } from '@react-three/fiber'
import { Sky, Stats } from '@react-three/drei'
import Experience from './Experience'

export default function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.6, 10], fov: 75 }}
      gl={{
        antialias: true,
        alpha: false,
      }}
    >
      {/* 性能监控（开发时使用） */}
      {import.meta.env.DEV && <Stats />}
      
      {/* 天空盒 */}
      <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0.6}
        azimuth={0.25}
      />
      
      {/* 环境光 */}
      <ambientLight intensity={0.5} />
      
      {/* 主光源 */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* 补光 */}
      <hemisphereLight
        intensity={0.3}
        groundColor="#080820"
        color="#87ceeb"
      />
      
      {/* 主体验组件 */}
      <Experience />
    </Canvas>
  )
}
