import { useStore } from '../../store/useStore'
import { useAdminStore } from '../../store/useAdminStore'
import Instructions from './Instructions'
import ChatPanel from './ChatPanel'
import SceneInfo from './SceneInfo'
import Controls from './Controls'
import SceneSelector from './SceneSelector'
import SceneTransition from './SceneTransition'
import ModelManager from '../Admin/ModelManager'
import ModelLibraryPanel from '../Admin/ModelLibraryPanel'
import EditorToolbar from '../Admin/EditorToolbar'
import PropertyPanel from '../Admin/PropertyPanel'
import './UI.css'

export default function UI() {
  const showInstructions = useStore((state) => state.showInstructions)
  const showChat = useStore((state) => state.showChat)
  const showSceneInfo = useStore((state) => state.showSceneInfo)
  const isPointerLocked = useStore((state) => state.isPointerLocked)
  const currentTheme = useStore((state) => state.currentTheme)
  const isTransitioning = useStore((state) => state.isTransitioning)
  
  // 管理员状态
  const userRole = useAdminStore((state) => state.userRole)
  const isEditMode = useAdminStore((state) => state.isEditMode)
  
  // 场景名称映射
  const sceneNames = {
    museum: '博物馆',
    redMansion: '红楼梦',
    silkRoad: '丝绸之路',
  }
  
  return (
    <div className="ui-container no-select">
      {/* 操作说明 */}
      {showInstructions && <Instructions />}
      
      {/* 场景选择器 */}
      <SceneSelector />
      
      {/* 场景过场动画 */}
      <SceneTransition 
        isTransitioning={isTransitioning} 
        sceneName={sceneNames[currentTheme]}
      />
      
      {/* 准星 */}
      {isPointerLocked && (
        <div className="crosshair">
          <div className="crosshair-dot" />
        </div>
      )}
      
      {/* 场景信息 */}
      {showSceneInfo && <SceneInfo />}
      
      {/* AI对话面板 */}
      {showChat && <ChatPanel />}
      
      {/* 控制按钮 */}
      <Controls />
      
      {/* 管理员工具 */}
      {isEditMode && <EditorToolbar />}
      {isEditMode && <ModelLibraryPanel />}
      {isEditMode && <PropertyPanel />}
      {isEditMode && <ModelManager />}
      
      {/* 标题和信息 */}
      <div className="header">
        <h1 className="title">AI+中国优秀传统文化</h1>
        <p className="subtitle">
          {sceneNames[currentTheme]} · 沉浸式文化遗产探索体验
          {userRole === 'admin' && <span className="admin-badge">👤 管理员</span>}
        </p>
      </div>
      
      {/* 版权信息 */}
      <div className="footer">
        <p>使用 Three.js + React 构建 | 按 ESC 退出第一人称视角</p>
      </div>
    </div>
  )
}
