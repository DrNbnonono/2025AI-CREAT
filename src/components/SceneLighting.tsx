// 昼夜光照管理系统
// 负责根据昼夜模式动态调整场景光照、雾效和背景
import { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { timeOfDayService, TimeOfDay } from '../services/timeOfDayService'
import * as THREE from 'three'

export default function SceneLighting() {
  const { scene } = useThree()
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null)
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null)
  const currentConfigRef = useRef(timeOfDayService.getConfig())

  // 初始化光照组件
  useEffect(() => {
    // 创建环境光
    if (!ambientLightRef.current) {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      ambientLightRef.current = ambientLight
      scene.add(ambientLight)
    }

    // 创建定向光（太阳光）
    if (!directionalLightRef.current) {
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
      dirLight.position.set(10, 20, 10)
      dirLight.castShadow = true

      // 配置阴影
      dirLight.shadow.mapSize.width = 2048
      dirLight.shadow.mapSize.height = 2048
      dirLight.shadow.camera.near = 0.5
      dirLight.shadow.camera.far = 100
      dirLight.shadow.camera.left = -50
      dirLight.shadow.camera.right = 50
      dirLight.shadow.camera.top = 50
      dirLight.shadow.camera.bottom = -50
      dirLight.shadow.bias = -0.0001

      directionalLightRef.current = dirLight
      scene.add(dirLight)
    }

    // 应用初始配置
    applyTimeConfig(currentConfigRef.current)

    // 订阅时间变化
    const unsubscribe = timeOfDayService.subscribe((time: TimeOfDay) => {
      const config = timeOfDayService.getConfig(time)
      currentConfigRef.current = config
      applyTimeConfig(config)
    })

    return () => {
      unsubscribe()
      // 清理资源
      if (ambientLightRef.current) {
        scene.remove(ambientLightRef.current)
      }
      if (directionalLightRef.current) {
        scene.remove(directionalLightRef.current)
      }
    }
  }, [scene])

  // 应用时间配置到场景
  const applyTimeConfig = (config: typeof timeOfDayService extends { getConfig(): infer T } ? T : never) => {
    if (!ambientLightRef.current || !directionalLightRef.current) return

    // 更新环境光
    ambientLightRef.current.intensity = config.lighting.ambientIntensity
    ambientLightRef.current.color = new THREE.Color(config.lighting.color)

    // 更新定向光
    directionalLightRef.current.intensity = config.lighting.directionalIntensity
    directionalLightRef.current.color = new THREE.Color(config.lighting.color)

    // 更新阴影透明度（通过调整阴影相机偏差和颜色）
    if (directionalLightRef.current.shadow) {
      (directionalLightRef.current.shadow as any).opacity = config.lighting.shadowOpacity
    }

    // 更新雾效
    if (config.fog) {
      scene.fog = new THREE.Fog(
        new THREE.Color(config.fog.color),
        config.fog.near,
        config.fog.far
      )
    }

    // 更新背景色
    if (config.background) {
      scene.background = new THREE.Color(config.background.color)
    }

    console.log(`🌞 昼夜光照已更新: ${config.label}`, {
      ambientIntensity: config.lighting.ambientIntensity,
      directionalIntensity: config.lighting.directionalIntensity,
      fogColor: config.fog.color,
      background: config.background.color,
    })
  }

  return null
}
