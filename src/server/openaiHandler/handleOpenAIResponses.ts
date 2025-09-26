import type express from 'express'
import type { ResponseCreateParams } from 'openai/resources/responses/responses'
import type * as vscode from 'vscode'
import { getVSCodeModel } from '@/server/handler'
import { handleChatCompletionError } from '@/server/openaiHandler/handleChatCompletionError'
import { validateResponseRequest } from '@/server/openaiHandler/validateResponseRequest'
import { logger } from '@/utils/logger'

/**
 * OpenAI互換のResponses APIリクエストを処理するメイン関数。
 * - リクエストバリデーション
 * - モデル取得
 * - LM APIへのリクエスト送信
 * - ストリーミング/非ストリーミングレスポンス処理
 * - エラーハンドリング
 * @param {express.Request} req リクエスト
 * @param {express.Response} res レスポンス
 * @returns {Promise<void>}
 */
export async function handleOpenAIResponses(
  req: express.Request,
  res: express.Response,
) {
  try {
    const body = req.body as ResponseCreateParams
    logger.debug('Received request', { body })

    // 必須フィールドのバリデーション
    validateResponseRequest(body)

    // モデル取得
    const { vsCodeModel } = await getVSCodeModel(body.model as string, 'openai')

    // ストリーミングモード判定
    const isStreaming = body.stream === true

    // // OpenAIリクエスト→VSCode LM API形式変換
    // const { messages, options, inputTokens } =
    //   await convertOpenAIRequestToVSCodeRequest(body, vsCodeModel)
  } catch (error) {
    const { statusCode, apiError } = handleChatCompletionError(
      error as vscode.LanguageModelError,
    )
    res.status(statusCode).json({ error: apiError })
  }
}
