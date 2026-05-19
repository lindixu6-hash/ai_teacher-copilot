/**
 * OpenAI/Kimi API 调用封装
 * 支持 OpenAI 和兼容 OpenAI 格式的 API（如 Kimi）
 */

import OpenAI from 'openai';

// 初始化客户端（支持 Kimi 等兼容 API）
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

// 默认模型配置
const DEFAULT_MODEL = process.env.OPENAI_BASE_URL?.includes('moonshot')
  ? 'moonshot-v1-8k'
  : 'gpt-4o-mini';

/**
 * 聊天完成选项
 */
interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
}

/**
 * 通用聊天完成函数
 */
export async function chatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 4000,
    responseFormat = 'text',
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI API 调用失败:', error);
    throw new Error('AI 服务暂时不可用，请稍后重试');
  }
}

/**
 * 流式聊天完成（用于实时显示）
 */
export async function chatCompletionStream(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  onChunk: (chunk: string) => void,
  options: ChatCompletionOptions = {}
): Promise<void> {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 4000,
  } = options;

  try {
    const stream = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        onChunk(content);
      }
    }
  } catch (error) {
    console.error('OpenAI API 流式调用失败:', error);
    throw new Error('AI 服务暂时不可用，请稍后重试');
  }
}

/**
 * 检查 API 可用性
 */
export async function checkAPIAvailable(): Promise<boolean> {
  try {
    const response = await openai.models.list();
    return response.data.length > 0;
  } catch (error) {
    console.error('OpenAI API 不可用:', error);
    return false;
  }
}
