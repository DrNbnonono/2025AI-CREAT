/// <reference types="vite/client" />
import axios from 'axios'

// AI API 配置
interface AIConfig {
  apiKey: string
  baseURL: string
  model: string
  provider: 'openai' | 'tongyi' | 'wenxin' | 'ollama' | 'custom'
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
  const finalConfig = { ...defaultConfig, ...config }
  
  // 如果没有配置API Key且不是 Ollama 或 openai provider（LM Studio使用openai provider但不需要真实key），返回模拟回复
  if (!finalConfig.apiKey && finalConfig.provider !== 'ollama' && finalConfig.provider !== 'openai') {
    console.warn('未配置AI API Key，使用模拟回复')
    return getMockResponse(messages[messages.length - 1]?.content || '')
  }
  
  console.log('🤖 调用 AI API:', {
    provider: finalConfig.provider,
    model: finalConfig.model,
    baseURL: finalConfig.baseURL,
    hasApiKey: !!finalConfig.apiKey
  })
  
  try {
    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Ollama 不需要 Authorization 头
    if (finalConfig.provider !== 'ollama' && finalConfig.apiKey) {
      headers['Authorization'] = `Bearer ${finalConfig.apiKey}`
    }
    
    // OpenAI 兼容格式（Ollama 也支持）
    const response = await axios.post(
      `${finalConfig.baseURL}/chat/completions`,
      {
        model: finalConfig.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      },
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
        console.log('🤔 AI 思考过程:', thinkContent.substring(0, 100) + '...')
        
        // 移除 <think> 标签及其内容
        reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
      }
    }
    
    console.log('✅ AI 回复成功，长度:', reply.length)
    return reply
  } catch (error: any) {
    console.error('❌ AI API 调用失败:', error)
    console.error('错误详情:', error.response?.data || error.message)
    
    if (error.response?.status === 401) {
      return '抱歉，API认证失败，请检查您的API Key配置。'
    } else if (error.code === 'ECONNABORTED') {
      return '抱歉，请求超时，请稍后再试。'
    } else {
      return '抱歉，AI服务暂时不可用，请稍后再试。'
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
