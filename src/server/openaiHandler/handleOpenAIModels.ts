import type express from 'express'
import type { PageResponse } from 'openai/pagination'
import type { Model } from 'openai/resources'
import { modelManager } from '@/manager/model'
import { logger } from '@/utils/logger'

/**
 * OpenAI互換のモデル一覧リクエストを処理する
 * @param {express.Request} req リクエスト
 * @param {express.Response} res レスポンス
 * @returns {Promise<void>}
 */
export async function handleOpenAIModels(
  _req: express.Request,
  res: express.Response,
) {
  try {
    // 利用可能なモデルを取得
    const availableModels = await modelManager.getAvailableModels()

    // OpenAI API形式に変換
    const now = Math.floor(Date.now() / 1000)
    const modelsData: Model[] = availableModels.map(model => ({
      id: model.id,
      object: 'model',
      created: now,
      owned_by: model.vendor || 'vscode',
    }))

    // プロキシモデルIDも追加
    modelsData.push({
      id: 'vscode-lm-proxy',
      object: 'model',
      created: now,
      owned_by: 'vscode-lm-proxy',
    })

    const openAIModelsResponse: PageResponse<Model> = {
      object: 'list',
      data: modelsData,
    }

    res.json(openAIModelsResponse)
  } catch (error: any) {
    logger.error(`OpenAI Models API error: ${error.message}`, error as Error)

    // エラーレスポンスの作成
    const statusCode = error.statusCode || 500
    const errorResponse = {
      error: {
        message: error.message || 'An unknown error has occurred',
        type: error.type || 'api_error',
        code: error.code || 'internal_error',
      },
    }

    res.status(statusCode).json(errorResponse)
  }
}
