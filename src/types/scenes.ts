// 场景类型定义
export interface SceneTheme {
  id: string
  name: string
  description: string
  background: string
  atmosphere: string
}

export const SCENE_THEMES: Record<string, SceneTheme> = {
  museum: {
    id: 'museum',
    name: '博物馆',
    description: '探索中国传统文物，了解悠久历史',
    background: 'dark',
    atmosphere: 'solemn',
  },
  redMansion: {
    id: 'redMansion',
    name: '红楼梦',
    description: '走进大观园，体验红楼梦的诗意世界',
    background: 'garden',
    atmosphere: 'poetic',
  },
  silkRoad: {
    id: 'silkRoad',
    name: '丝绸之路',
    description: '穿越古丝绸之路，见证东西文化交流',
    background: 'desert',
    atmosphere: 'adventure',
  },
}
