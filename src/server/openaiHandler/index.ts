import type express from 'express'
import { handleOpenAIChatCompletions } from '@/server/openaiHandler/handleOpenAIChatCompletions'
import { handleOpenAIModelInfo } from '@/server/openaiHandler/handleOpenAIModelInfo'
import { handleOpenAIModels } from '@/server/openaiHandler/handleOpenAIModels'

/**
 * OpenAI互換のChat Completions APIエンドポイントを設定する
 * @param {express.Express} app Express.jsアプリケーション
 * @returns {void}
 */
export function setupOpenAIChatCompletionsEndpoints(
  app: express.Express,
): void {
  // OpenAI API互換エンドポイントを登録
  app.post('/openai/chat/completions', handleOpenAIChatCompletions)
  app.post('/openai/v1/chat/completions', handleOpenAIChatCompletions)
}

/**
 * OpenAI互換のModels APIエンドポイントを設定する
 * @param {express.Express} app Express.jsアプリケーション
 * @returns {void}
 */
export function setupOpenAIModelsEndpoints(app: express.Express): void {
  // モデル一覧エンドポイント
  app.get('/openai/models', handleOpenAIModels)
  app.get('/openai/v1/models', handleOpenAIModels)

  // 特定モデル情報エンドポイント
  app.get('/openai/models/:model', handleOpenAIModelInfo)
  app.get('/openai/v1/models/:model', handleOpenAIModelInfo)
}
