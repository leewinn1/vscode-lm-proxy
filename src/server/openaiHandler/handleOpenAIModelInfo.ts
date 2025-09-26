import type express from 'express'
import type { Model } from 'openai/resources'
import { modelManager } from '@/manager/model'
import { logger } from '@/utils/logger'

/**
 * OpenAI互換の単一モデル情報リクエストを処理する
 * @param {express.Request} req リクエスト
 * @param {express.Response} res レスポンス
 * @returns {Promise<void>}
 */
export async function handleOpenAIModelInfo(
  req: express.Request,
  res: express.Response,
) {
  try {
    const modelId = req.params.model

    if (modelId === 'vscode-lm-proxy') {
      // vscode-lm-proxyの場合、固定情報を返す
      const now = Math.floor(Date.now() / 1000)
      const openAIModel: Model = {
        id: 'vscode-lm-proxy',
        object: 'model',
        created: now,
        owned_by: 'vscode-lm-proxy',
      }
      res.json(openAIModel)
      return
    }

    // LM APIからモデル情報を取得
    const vsCodeModel = await modelManager.getModelInfo(modelId)

    // モデルが存在しない場合はエラーをスロー
    if (!vsCodeModel) {
      throw {
        ...new Error(`Model ${modelId} not found`),
        statusCode: 404,
        type: 'model_not_found_error',
      }
    }

    // OpenAI API形式に変換
    const openAIModel: Model = {
      id: vsCodeModel.id,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: vsCodeModel.vendor || 'vscode',
    }

    // レスポンスを返却
    res.json(openAIModel)
  } catch (error: any) {
    logger.error(
      `OpenAI Model info API error: ${error.message}`,
      error as Error,
    )

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
