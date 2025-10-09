# AI+中国优秀传统文化 - 沉浸式文化遗产体验

> 运用 AI 技术与 Three.js 3D 场景打造的第一人称文化遗产探索体验

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 项目简介

这是一个为"AI+中国优秀传统文化"比赛设计的交互式 Web 应用，通过第一人称视角，让用户沉浸式地探索中国传统文化遗产。当走近文物时，AI 会自动进行讲解，用户还可以随时向 AI 提问，获得个性化的文化知识解答。

### ✨ 核心特性

- 🎮 **第一人称自由探索** - 使用 WASD/方向键移动，鼠标环顾四周
- 🏺 **智能触发系统** - 靠近文物自动触发 AI 讲解
- 🤖 **AI 智能导览** - 支持实时对话，回答关于文物的任何问题
- 🎨 **精美 3D 场景** - 基于 Three.js 构建的逼真环境
- 📱 **响应式设计** - 支持桌面端和移动端
- ⚡ **高性能优化** - 采用 LOD、压缩等技术确保流畅运行

## 🚀 快速开始

> 如果已经具备 Node.js 与 npm 环境，直接按照下方“全量部署教程”执行即可。

### 环境要求

- Node.js 18 LTS（推荐使用 [nvm](https://github.com/nvm-sh/nvm) 或 [fnm](https://github.com/Schniz/fnm) 管理版本）
- npm 9+ 或 yarn 1.22+
- Git 2.40+

### 全量部署教程

1. **安装 Node.js & npm**
   - Windows: 前往 [nodejs.org](https://nodejs.org/) 下载并安装 LTS 版本；安装完成后重新打开终端。
   - macOS/Linux: 推荐使用 nvm/fnm 安装：
     ```bash
     # 以 nvm 为例
     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
     nvm install 18
     nvm use 18
     ```
   - 验证版本：
     ```bash
     node -v   # 应输出 v18.x.x
     npm -v    # 应输出 9.x.x 以上
     ```

2. **克隆并进入项目目录**
   ```bash
   git clone https://github.com/DrNbnonono/2025AI-CREAT.git
   cd 2025AI-CREAT
   ```

3. **安装依赖**（首次运行必做）
   ```bash
   npm install
   ```
   > 如果使用国内镜像，可临时指定 `npm_config_registry=https://registry.npmmirror.com npm install`

4. **配置环境变量（可选）**
   - 项目附带 `.env.example`，覆盖常用 AI 服务配置；默认无需修改即可体验（内置模拟回复）。
   - 如需真实模型：
     ```bash
     cp .env.example .env
     ```
     根据需求选择：
       - **LM Studio / OpenRouter / DeepSeek**：填写对应 Key 与 Base URL。
       - **Ollama 本地模型**：`VITE_AI_PROVIDER=ollama`，保持 `VITE_AI_API_KEY` 为空。

5. **启动开发服务器**
   ```bash
   npm run dev
   ```
   - 启动脚本会自动执行模型扫描脚本 `scripts/scan-models.cjs`，生成/更新 `public/models/index.json`。
   - 浏览器打开 `http://localhost:5173`（或终端输出的端口）即可访问。
   - 若需文件监听自动刷新模型索引，可单独运行 `npm run dev:watch`。

6. **模型与资源**
   - 仓库已包含演示模型索引，无需上传任何额外文件即可体验。
   - 如需新增模型，将 `.glb/.gltf` 拖入 `public/models/`，开发模式下会自动识别。
   - 控制台脚本：
     ```bash
     npm run models:scan   # 手动重新扫描
     ```

7. **生产构建与预览**
   ```bash
   npm run build       # 生成 dist/
   npm run preview     # 本地预览生产构建
   ```

8. **常见问题排查**
   - 启动报错 `ENOENT: no such file or directory, open '.env'`：复制 `.env.example`。
   - 浏览器空白：检查终端是否有编译错误；确认端口未被占用。
   - AI 调用失败：核对 `.env` 配置或 fallback 到内置模拟回复。

> ✅ 完成以上步骤后，下载源码即可开箱即用，无需额外上传或配置模型资源。

## 🎮 使用指南

### 控制方式

**移动控制：**
- `W` / `↑` - 向前移动
- `S` / `↓` - 向后移动
- `A` / `←` - 向左移动
- `D` / `→` - 向右移动
- `Space` - 跳跃
- `鼠标` - 环顾四周
- `ESC` - 解除鼠标锁定

**交互控制：**
- 点击屏幕 - 进入第一人称视角
- 点击"AI 对话"按钮 - 打开/关闭对话面板
- 点击"帮助"按钮 - 查看操作说明

### 探索体验

1. **开始探索** - 点击"开始探索"按钮，然后点击屏幕进入第一人称视角
2. **寻找文物** - 在场景中移动，寻找三件传统文化文物
3. **AI 自动讲解** - 走近文物时，AI 会自动介绍相关知识
4. **提问互动** - 在 AI 对话框中输入问题，获得详细解答
5. **完成探索** - 收集所有文物的访问标记

## 🏗️ 技术架构

### 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **3D 引擎**: Three.js + React Three Fiber
- **状态管理**: Zustand
- **HTTP 客户端**: Axios
- **样式**: CSS3 + 自定义动画

### 项目结构

```
2025AI+/
├── public/                      # 静态资源目录
│   ├── models/                  # 3D 模型文件（GLB/GLTF）
│   │   ├── index.json           # 模型索引（脚本自动生成）
│   │   └── .gitkeep
│   └── vite.svg                 # 网站图标
│
├── src/                         # 源代码目录
│   ├── components/              # React 组件
│   │   ├── UI/                  # UI 层组件（对话、场景信息等）
│   │   │   ├── UI.tsx / UI.css
│   │   │   ├── Controls.tsx / Controls.css
│   │   │   ├── ChatPanel.tsx / ChatPanel.css
│   │   │   ├── SceneInfo.tsx / SceneInfo.css
│   │   │   ├── Instructions.tsx / Instructions.css
│   │   │   └── LoadingScreen.tsx / LoadingScreen.css
│   │   │
│   │   ├── Scene.tsx               # Three.js 主场景容器
│   │   ├── Experience.tsx          # 核心体验逻辑（触发检测、控制切换）
│   │   ├── FirstPersonControls.tsx # 游客模式第一人称控制器
│   │   ├── EditorControls.tsx      # 管理员 Orbit 控制器
│   │   ├── ModelPlacementHelper.tsx# 鼠标射线预览与放置
│   │   ├── SceneEnvironment.tsx    # 场景环境与模型渲染
│   │   ├── TriggerZones.tsx        # 触发区域可视化（开发用）
│   │   └── Admin/                  # 管理员工具模块
│   │       ├── AdminLogin.tsx / AdminLogin.css
│   │       ├── ModelManager.tsx / ModelManager.css
│   │       ├── ModelLibraryPanel.tsx / ModelLibraryPanel.css
│   │       ├── PropertyPanel.tsx / PropertyPanel.css
│   │       └── EditorToolbar.tsx / EditorToolbar.css
│   │
│   ├── data/                    # 预设数据
│   │   └── sceneData.ts         # 默认场景点位与 AI 文案
│   │
│   ├── services/                # 业务服务层
│   │   └── aiService.ts         # AI API 服务（多提供商、<think> 过滤）
│   │
│   ├── store/                   # 全局状态管理（Zustand）
│   │   ├── useStore.ts          # 玩家/场景/对话状态
│   │   └── useAdminStore.ts     # 管理员状态
│   │
│   ├── App.tsx / App.css        # 应用根组件
│   ├── main.tsx                 # 应用入口
│   └── index.css                # 全局样式
│
├── scripts/                    # 辅助脚本
│   ├── scan-models.cjs          # 启动前扫描模型目录并生成 index.json
│   └── watch-models.cjs         # dev 模式实时监听 models 目录
│
├── .env.example                 # 环境变量配置示例
├── .gitignore                   # Git 忽略文件
├── README.md                    # 项目说明文档（本文件）
├── index.html                   # HTML 入口
├── package.json                 # 项目依赖和脚本
├── tsconfig.json / tsconfig.node.json
├── vite.config.ts               # Vite 构建配置
└── vite.config.upload.ts        # 带文件上传功能的 Vite 配置（dev 模式）
```

**目录说明：**

- **`src/components/`**: 所有 React 组件
  - **`UI/`**: 用户界面组件（对话框、按钮、说明等）
  - **`Admin/`**: 管理员模式组件（模型管理、场景编辑等）
  - **场景组件**: Three.js 相关的 3D 场景组件
- **`src/services/`**: 业务逻辑服务（AI API 调用等）
- **`src/store/`**: 全局状态管理（玩家位置、场景点位、消息等）
- **`public/models/`**: 存放 3D 模型文件（支持 GLB/GLTF 格式）
  - **`uploaded/`**: 通过管理员界面上传的模型存储目录（自动创建）

### 核心系统

#### 1. 场景触发器系统

自动检测玩家位置，当进入文物的触发半径时：
- 显示场景信息面板
- 自动弹出 AI 讲解
- 标记文物为已访问

#### 2. AI 对话系统

- 支持 OpenAI 兼容 API
- 内置智能模拟回复（无需配置即可演示）
- 上下文感知，基于当前场景提供准确信息
- 对话历史管理

#### 3. 第一人称控制器

- 基于 PointerLockControls
- 平滑移动和视角控制
- 重力和跳跃物理
- 地面碰撞检测

## 🎨 场景文物

当前包含三件传统文化文物：

1. **商代青铜鼎** 🏺
   - 位置：场景中央
   - 特点：失蜡法铸造，饕餮纹饰
   - 文化价值：礼器，权力象征

2. **唐代丝绸画卷** 📜
   - 位置：场景左侧
   - 特点：精美织锦，色彩艳丽
   - 文化价值：丝绸之路的见证

3. **战国玉璧** 💍
   - 位置：场景右侧
   - 特点：温润如玉，工艺精湛
   - 文化价值：君子比德于玉

## 🔧 自定义与扩展

### 添加新的场景点位

编辑 `src/store/useStore.ts`，在 `scenePoints` 数组中添加新对象：

```typescript
{
  id: 'your-artifact-id',
  name: '文物名称',
  position: new Vector3(x, y, z),
  radius: 3,
  description: '简短描述',
  aiContext: '详细的 AI 知识库内容...',
  visited: false,
}
```

### 添加 3D 模型

1. 将 GLB/GLTF 模型文件放入 `public/models/` 目录
2. 在 `SceneEnvironment.tsx` 中使用 `useGLTF` 加载模型
3. 建议使用 Draco 压缩以减小文件大小

### 更换 AI 服务

支持任何 OpenAI 兼容的 API，只需在 `.env` 中配置：

**Ollama 本地模型（推荐用于开发）：**
```env
VITE_AI_BASE_URL=http://localhost:11434/v1
VITE_AI_MODEL=qwen2.5:7b
VITE_AI_PROVIDER=ollama
# 注意：Ollama 不需要 API Key
```

**如何使用 Ollama：**
1. 访问 https://ollama.com/download 下载安装
2. 运行 `ollama pull qwen2.5:7b` 下载模型
3. 确保 Ollama 服务正在运行（通常自动启动）
4. 配置 `.env` 文件为上述 Ollama 配置
5. 启动项目即可使用本地 AI

**通义千问示例：**
```env
VITE_AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
VITE_AI_API_KEY=your_tongyi_api_key
VITE_AI_MODEL=qwen-turbo
VITE_AI_PROVIDER=tongyi
```

**OpenAI GPT：**
```env
VITE_AI_BASE_URL=https://api.openai.com/v1
VITE_AI_API_KEY=sk-your_openai_key
VITE_AI_MODEL=gpt-3.5-turbo
VITE_AI_PROVIDER=openai
```

## 📱 兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ 移动端浏览器（功能正常，但体验更适合桌面端）

## 🎯 性能优化建议

1. **3D 模型优化**
   - 使用 GLB 格式并启用 Draco 压缩
   - 控制模型面数（推荐 < 50K 三角面）
   - 使用 LOD（细节层次）技术

2. **纹理优化**
   - 使用 WebP 格式
   - 纹理尺寸不超过 2048x2048
   - 启用 mipmap

3. **代码优化**
   - 已实现代码分割（three-vendor chunk）
   - 使用 React.memo 减少不必要的重渲染
   - 避免在每帧中创建新对象

## 🐛 常见问题

### Q: 第一人称视角无法进入？
A: 确保点击了屏幕，现代浏览器需要用户交互才能锁定指针。

### Q: AI 没有回复？
A: 检查是否配置了 API Key。如果没有配置，会使用内置的模拟回复。

### Q: 场景加载很慢？
A: 3D 模型可能太大，建议使用 Draco 压缩或减少模型复杂度。

### Q: 移动端无法正常使用？
A: 第一人称控制更适合桌面端，移动端建议添加虚拟摇杆控制。

### Q: 模型管理面板无法调整大小？
A: 在面板顶部有一个resize手柄，鼠标悬停显示，向上拖动可以增加面板高度。

### Q: 上传的模型没有立即显示？
A: 文件监听系统会在250ms内自动更新index.json，稍等片刻后刷新模型列表即可。

## 🎬 管理员功能

### 模型上传与管理
- **上传模型**: 点击"📁 上传模型"按钮选择GLB/GLTF文件上传到`public/models/uploaded/`
- **实时扫描**: dev模式下自动监听models文件夹变化，新增模型自动识别
- **拖拽放置**: 使用TransformControls精确调整模型位置、旋转、缩放
- **配置导出/导入**: 场景配置可以导出为JSON，分享给其他用户导入

### 场景编辑快捷键
- `G` - 切换移动模式
- `R` - 切换旋转模式
- `S` - 切换缩放模式
- `Delete` - 删除选中对象
- `Escape` - 取消选择

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件到：[your-email]

---

**祝您探索愉快！🎉**
