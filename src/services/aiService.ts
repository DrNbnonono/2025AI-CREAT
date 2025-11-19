/// <reference types="vite/client" />
import axios from 'axios'

// AI API 配置
interface AIConfig {
  apiKey: string
  baseURL: string
  model: string
  provider: 'openai' | 'tongyi' | 'wenxin' | 'ollama' | 'custom' | 'lmstudio'
}

// 默认配置（用户需要根据实际情况修改）
const defaultConfig: AIConfig = {
  apiKey: import.meta.env.VITE_AI_API_KEY || '',
  baseURL: import.meta.env.VITE_AI_BASE_URL || 'https://api.openai.com/v1',
  model: import.meta.env.VITE_AI_MODEL || 'gpt-3.5-turbo',
  provider: (import.meta.env.VITE_AI_PROVIDER as AIConfig['provider']) || 'openai',
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * 调用AI API获取回复
 */
export async function getAIResponse(
  messages: ChatMessage[],
  config: Partial<AIConfig> = {}
): Promise<string> {
  // 优先从 localStorage 读取用户配置（通过LLMConfigPanel设置），再使用环境变量
  let storedConfig: Partial<AIConfig> = {}
  if (typeof window !== 'undefined') {
    const savedConfig = localStorage.getItem('llm-config')
    if (savedConfig) {
      try {
        storedConfig = JSON.parse(savedConfig)
        if (import.meta.env.DEV) console.log('📂 读取 localStorage 配置:', storedConfig)
      } catch (e) {
        console.warn('❌ 无法解析 localStorage 配置:', e)
      }
    }
  }

  // 合并配置：环境变量 < localStorage < 函数参数
  const finalConfig = { ...defaultConfig, ...storedConfig, ...config }

  // 如果没有配置API Key且不是 Ollama、LM Studio 或本地服务，返回模拟回复
  // 检测是否为本地服务（localhost、127.0.0.1、192.168.x.x或169.254.x.x）
  const isLocalService = finalConfig.baseURL.includes('localhost') ||
                         finalConfig.baseURL.includes('127.0.0.1') ||
                         finalConfig.baseURL.match(/^https?:\/\/(192\.168\.|10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.)/) ||
                         finalConfig.baseURL.match(/^https?:\/\/169\.254\./)

  if (!finalConfig.apiKey &&
      finalConfig.provider !== 'ollama' &&
      finalConfig.provider !== 'custom' &&
      finalConfig.provider !== 'lmstudio' &&
      !isLocalService) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ 未配置AI API Key，使用模拟回复')
      console.log('📋 配置详情:', {
        provider: finalConfig.provider,
        baseURL: finalConfig.baseURL,
        isLocalService: isLocalService,
        configSource: storedConfig.baseURL ? 'localStorage' : 'environment'
      })
      console.log('💡 提示：如果是本地服务（如LM Studio、Ollama），确保Base URL包含localhost、127.0.0.1、192.168.x.x或169.254.x.x')
    }
    return getMockResponse(messages[messages.length - 1]?.content || '')
  }
  
  if (import.meta.env.DEV) {
    console.log('🤖 调用 AI API:', {
      provider: finalConfig.provider,
      model: finalConfig.model,
      baseURL: finalConfig.baseURL,
      hasApiKey: !!finalConfig.apiKey,
      isLocalService,
      configSource: storedConfig.baseURL ? 'localStorage' : 'environment'
    })
  }
  
  try {
    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // Ollama、LM Studio、custom provider和本地服务不需要Authorization头（如果apiKey为空或使用本地地址）
    if (finalConfig.apiKey && finalConfig.provider !== 'ollama' && finalConfig.provider !== 'custom' && finalConfig.provider !== 'lmstudio' && !isLocalService) {
      headers['Authorization'] = `Bearer ${finalConfig.apiKey}`
    }

    // 准备请求体
    const requestBody = {
      model: finalConfig.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
    }

    if (import.meta.env.DEV) {
      console.log('📡 发送请求到:', `${finalConfig.baseURL}/chat/completions`)
      console.log(' 请求头:', headers)
      console.log('📦 请求体:', requestBody)
    }

    // OpenAI 兼容格式（Ollama、LM Studio、custom provider 也支持）
    const response = await axios.post(
      `${finalConfig.baseURL}/chat/completions`,
      requestBody,
      {
        headers,
        timeout: 30000,
      }
    )
    
    let reply = response.data.choices[0]?.message?.content || '抱歉，我暂时无法回答这个问题。'
    
    // 处理 DeepSeek R1 等模型的 <think> 标签
    if (reply.includes('<think>')) {
      const thinkMatch = reply.match(/<think>([\s\S]*?)<\/think>/g)
      if (thinkMatch) {
        // 提取思考内容（可选：可以用于调试）
        const thinkContent = thinkMatch[0].replace(/<\/?think>/g, '').trim()
        if (import.meta.env.DEV) console.log('🤔 AI 思考过程:', thinkContent.substring(0, 100) + '...')
        
        // 移除 <think> 标签及其内容
        reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
      }
    }
    
    if (import.meta.env.DEV) console.log('✅ AI 回复成功，长度:', reply.length)
    return reply
  } catch (error: any) {
    console.error('❌ AI API 调用失败')
    console.error('错误类型:', error.name)
    console.error('错误信息:', error.message)
    console.error('响应状态:', error.response?.status)
    console.error('响应数据:', error.response?.data)

    // 检测是否为 CORS 错误
    const isCorsError = error.message.includes('CORS') ||
                        error.message.includes('Cross-Origin') ||
                        error.message.includes('Network Error')

    if (error.response?.status === 401) {
      return `抱歉，API认证失败（401）。\n\n可能的原因：\n• API Key无效或过期\n• 请检查.env文件中的VITE_AI_API_KEY配置\n• LM Studio无需API Key，确保VITE_AI_API_KEY为空`
    } else if (error.response?.status === 404) {
      return `抱歉，未找到AI服务（404）。\n\n请检查：\n• LM Studio是否已启动\n• Base URL是否正确（如：http://localhost:1234/v1）\n• 确保在LM Studio中启用了"Enable CORS"`
    } else if (error.code === 'ECONNABORTED') {
      return '抱歉，请求超时（30秒）。请检查网络连接或LM Studio是否正常运行。'
    } else if (error.code === 'ECONNREFUSED') {
      return `抱歉，无法连接到AI服务。\n\n请检查：\n• LM Studio是否已启动\n• Base URL是否正确（默认：http://localhost:1234/v1）\n• 端口是否被占用\n• 防火墙是否阻止了连接`
    } else if (isCorsError) {
      return `⚠️ CORS 跨域错误\n\n这是最常见的问题！请立即执行以下步骤：\n\n1️⃣ 打开 LM Studio\n2️⃣ 进入 Settings → Developer\n3️⃣ 勾选 "Enable CORS" ☑️\n4️⃣ 重启 LM Studio\n5️⃣ 重新测试\n\n如果仍有问题，请使用项目根目录下的 lm-studio-test.html 工具进行调试。`
    } else if (error.response?.data?.error) {
      const errorMsg = error.response.data.error.message || JSON.stringify(error.response.data.error)
      return `AI服务返回错误：\n${errorMsg}`
    } else if (error.message.includes('Failed to fetch')) {
      return `网络连接失败。\n\n可能的原因：\n• LM Studio 未启动\n• IP 地址或端口错误\n• CORS 未启用\n• 防火墙阻止\n\n解决方案：\n1. 确保 LM Studio 已启动且模型已加载\n2. 检查 .env 中的 VITE_AI_BASE_URL\n3. 启用 LM Studio 的 CORS 设置\n4. 使用 lm-studio-test.html 测试连接`
    } else {
      return `抱歉，AI服务暂时不可用。\n\n错误详情：${error.message}\n\n请检查：\n• LM Studio是否正常运行\n• 模型是否已加载\n• CORS 是否已启用\n• 网络连接是否正常\n\n建议使用 lm-studio-test.html 工具进行诊断。`
    }
  }
}

/**
 * 模拟AI回复（用于演示和测试）
 */
function getMockResponse(question: string): string {
  const lowerQuestion = question.toLowerCase()
  
  // 关键词匹配
  if (lowerQuestion.includes('青铜') || lowerQuestion.includes('鼎')) {
    return `青铜鼎是商代最重要的礼器之一。它不仅是烹饪器具，更是权力和地位的象征。

制作工艺：
- 采用失蜡法（失蜡铸造）
- 需要高超的合金配比技术（铜锡铅）
- 器身的纹饰采用范铸法

文化意义：
"鼎"在中国文化中具有特殊地位，"问鼎中原"、"一言九鼎"等成语都源于此。商周时期，鼎的数量和大小代表了使用者的等级。

您还想了解哪方面的信息呢？比如铭文、纹饰或者祭祀仪式？`
  }
  
  if (lowerQuestion.includes('丝绸') || lowerQuestion.includes('画卷')) {
    return `唐代是中国丝绸工艺的巅峰时期。

丝绸的制作：
- 养蚕取丝：选用优质桑蚕
- 缫丝：将蚕茧抽成丝线
- 织造：使用提花机织成各种图案
- 染色：采用天然植物和矿物染料

唐代丝绸特点：
- 图案丰富多样（花鸟、几何、狩猎纹等）
- 色彩艳丽持久
- 质地轻薄如云
- 融合了波斯、中亚等地的艺术元素

丝绸之路让中国丝绸远销西方，成为东西方文化交流的重要媒介。`
  }
  
  if (lowerQuestion.includes('玉') || lowerQuestion.includes('璧')) {
    return `玉璧是中国古代"六器"之一，用于祭天。

玉璧的特点：
- 圆形，中间有孔
- 孔径与璧身比例有严格规定
- 通常使用和田玉等优质玉料

文化内涵：
"君子比德于玉"，儒家将玉的特质与君子的品德相联系：
- 温润：仁慈宽厚
- 缜密：智慧周详
- 廉洁：公正廉明
- 不折：坚韧不屈

玉璧的圆形也体现了中国古代"天圆地方"的宇宙观念。

您想了解更多关于玉器的知识吗？`
  }
  
  if (lowerQuestion.includes('怎么') || lowerQuestion.includes('如何')) {
    return `这是一个很好的问题！关于这个话题：

1. 历史背景：这些文物反映了中国古代高度发达的手工业和艺术水平
2. 技术工艺：古代工匠掌握了复杂的制作技艺
3. 文化意义：承载着丰富的礼制和精神内涵

您可以继续提问，我会尽力为您解答。比如您想了解某个文物的具体细节、历史故事、或者制作工艺吗？`
  }
  
  // 默认回复
  return `感谢您的提问！关于"${question}"，这是一个很有意思的话题。

作为AI文化导览，我很乐意帮您深入了解中国传统文化。您可以问我关于：

🏺 文物的历史背景和制作工艺
📜 相关的历史故事和文化内涵
🎨 艺术特点和审美价值
🔍 文物背后的社会制度和生活方式

请随时向我提问，我会竭诚为您解答！`
}

/**
 * 根据场景主题构建专门的系统提示词
 */
export function buildSystemPrompt(sceneContext?: string, sceneTheme?: string): string {
  // 场景主题特定的提示词
  const themePrompts = {
    museum: `你是一位资深的博物馆讲解员，专精于中国古代文物鉴赏。

专业领域：
- 青铜器工艺与文化（失蜡法、铸造技术、铭文解读）
- 丝绸纺织历史（养蚕、织造、丝绸之路）
- 玉器文化（玉的品质鉴定、雕琢工艺、礼器文化）
- 考古发现和文物保护

讲解特点：
- 结合考古发现讲述文物背后的故事
- 详细解释制作工艺和技术细节
- 阐述文物的历史价值和文化意义
- 对比不同时期的工艺发展`,

    redMansion: `你是一位精通《红楼梦》的文学专家和古典园林研究者。

专业领域：
- 《红楼梦》情节、人物性格分析
- 清代园林建筑艺术（亭台楼阁、假山池沼）
- 古代女子生活方式和礼仪
- 诗词歌赋、文学典故

讲解特点：
- 引用原著诗词和情节
- 解析人物性格和命运寓意
- 讲述园林布局的艺术巧思
- 探讨作品的文化内涵和现实意义`,

    silkRoad: `你是一位丝绸之路历史学家和文化交流专家。

专业领域：
- 丝绸之路的历史沿革
- 唐代长安的国际化特征
- 敦煌莫高窟艺术
- 东西方文化交流与融合
- 古代贸易和商队

讲解特点：
- 讲述东西方文化交流的故事
- 介绍不同文明的碰撞与融合
- 描绘古代商人的艰辛旅程
- 展现丝路沿线的多元文化`,
  }
  
  // 选择合适的主题提示词
  let themeSpecificPrompt = ''
  if (sceneTheme && sceneTheme in themePrompts) {
    themeSpecificPrompt = themePrompts[sceneTheme as keyof typeof themePrompts]
  }
  
  const basePrompt = `${themeSpecificPrompt || '你是一位专业的中国传统文化AI导览员，精通中国历史、文物、艺术和传统文化。'}

核心职责：
1. 用通俗易懂、引人入胜的语言讲解文化知识
2. 保持专业性和准确性，必要时引用史料典籍
3. 讲述生动的历史故事和有趣的细节
4. 回答控制在150-250字，简洁而富有信息量
5. 积极引导参观者深入探索和思考

回答风格：
- 热情友好，如同面对面交流
- 语言生动形象，善用比喻和场景描写
- 适度使用emoji（如🏺📜💍）增强表现力
- 如有不确定的信息，诚实说明
- 多用"您"而非"你"，体现尊重

互动技巧：
- 对用户的好奇心给予肯定
- 引导性提问，激发更深层次的兴趣
- 联系现实生活，让历史"活"起来
- 在回答末尾提出相关问题，鼓励继续对话

`
  
  if (sceneContext) {
    return basePrompt + `\n=== 当前场景详细信息 ===\n${sceneContext}\n\n请基于以上信息，结合您的专业知识，为用户提供深入而有趣的讲解。`
  }
  
  return basePrompt
}
