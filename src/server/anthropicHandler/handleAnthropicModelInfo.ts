import type { ErrorObject, ModelInfo } from '@anthropic-ai/sdk/resources'
import type express from 'express'
import { modelManager } from '@/manager/model'
import { logger } from '@/utils/logger'

/**
 * Anthropic互換の単一モデル情報リクエストを処理する
 * @param {express.Request} req リクエスト
 * @param {express.Response} res レスポンス
 * @returns {Promise<void>}
 */
export async function handleAnthropicModelInfo(
  req: express.Request,
  res: express.Response,
) {
  try {
    const modelId = req.params.model

    if (modelId === 'vscode-lm-proxy') {
      // vscode-lm-proxyの場合、固定情報を返す
      const anthropicModel: ModelInfo = {
        created_at: Math.floor(Date.now() / 1000).toString(),
        display_name: 'VSCode LM Proxy',
        id: 'vscode-lm-proxy',
        type: 'model',
      }
      res.json(anthropicModel)
      return
    }

    // LM APIからモデル情報を取得
    const vsCodeModel = await modelManager.getModelInfo(modelId)

    // モデルが存在しない場合はエラーをスロー
    if (!vsCodeModel) {
      throw {
        ...new Error(`Model ${modelId} not found`),
        statusCode: 404,
        type: 'not_found_error',
      }
    }

    // Anthropic API形式に変換
    const anthropicModel: ModelInfo = {
      created_at: Math.floor(Date.now() / 1000).toString(),
      display_name: vsCodeModel.name,
      id: vsCodeModel.id,
      type: 'model',
    }

    // レスポンスを返却
    res.json(anthropicModel)
  } catch (error: any) {
    logger.error(
      `Anthropic Model Info API error: ${error.message}`,
      error as Error,
    )

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
