import type { PageResponse } from '@anthropic-ai/sdk/core/pagination'
import type { ErrorObject, ModelInfo } from '@anthropic-ai/sdk/resources'
import type express from 'express'
import { modelManager } from '@/manager/model'
import { logger } from '@/utils/logger'

/**
 * Anthropic互換のモデル一覧リクエストを処理する
 * @param {express.Request} req リクエスト
 * @param {express.Response} res レスポンス
 * @returns {Promise<void>}
 */
export async function handleAnthropicModels(
  _req: express.Request,
  res: express.Response,
) {
  try {
    // 利用可能なモデルを取得
    const availableModels = await modelManager.getAvailableModels()

    // Anthropic API形式に変換
    const now = Math.floor(Date.now() / 1000)
    const modelsData: ModelInfo[] = availableModels.map(model => ({
      created_at: now.toString(),
      display_name: model.name,
      id: model.id,
      type: 'model',
    }))

    // プロキシモデルIDも追加
    modelsData.push({
      created_at: now.toString(),
      display_name: 'VSCode LM Proxy',
      id: 'vscode-lm-proxy',
      type: 'model',
    })

    const anthropicModelsResponse: PageResponse<ModelInfo> = {
      data: modelsData,
      first_id: modelsData[0].id,
      has_more: false,
      last_id: modelsData[modelsData.length - 1].id,
    }

    res.json(anthropicModelsResponse)
  } catch (error: any) {
    logger.error(`Anthropic Models API error: ${error.message}`, error as Error)

    // エラーレスポンスの作成
    const statusCode = error.statusCode || 500
    const errorResponse = {
      type: 'error',
      error: {
        message: error.message || 'An unknown error has occurred',
        type: error.type || 'api_error',
      } as ErrorObject,
    }

    res.status(statusCode).json(errorResponse)
  }
}
