import { useStore } from '../store/useStore'
import { Sphere } from '@react-three/drei'

export default function TriggerZones() {
  const scenePoints = useStore((state) => state.scenePoints)
  const currentPoint = useStore((state) => state.currentPoint)
  
  return (
    <group>
      {scenePoints.map((point) => {
        const isActive = currentPoint?.id === point.id
        return (
          <Sphere
            key={point.id}
            args={[point.radius, 16, 16]}
            position={[point.position.x, 0.5, point.position.z]}
          >
            <meshBasicMaterial
              color={isActive ? '#00ff00' : '#ffff00'}
              transparent
              opacity={0.1}
              wireframe
            />
          </Sphere>
        )
      })}
    </group>
  )
}
