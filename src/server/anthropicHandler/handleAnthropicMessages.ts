import type {
  Message,
  MessageCreateParams,
  RawMessageStreamEvent,
} from '@anthropic-ai/sdk/resources'
import type express from 'express'
import * as vscode from 'vscode'
import { convertAnthropicRequestToVSCodeRequest } from '@/converter/anthropic/convertAnthropicRequestToVSCodeRequest'
import { convertVSCodeResponseToAnthropicResponse } from '@/converter/anthropic/convertVSCodeResponseToAnthropicResponse'
import { handleMessageError } from '@/server/anthropicHandler/handleMessageError'
import { handleStreamingResponse } from '@/server/anthropicHandler/handleStreamingResponse'
import { validateMessagesRequest } from '@/server/anthropicHandler/validateMessagesRequest'
import { getVSCodeModel } from '@/server/handler'
import { logger } from '@/utils/logger'

/**
 * Anthropic互換のMessages APIリクエストを処理するメイン関数。
 * - リクエストバリデーション
 * - モデル取得
 * - LM APIへのリクエスト送信
 * - ストリーミング/非ストリーミングレスポンス処理
 * - エラーハンドリング
 * @param {express.Request} req リクエスト
 * @param {express.Response} res レスポンス
 * @returns {Promise<void>}
 */
export async function handleAnthropicMessages(
  req: express.Request,
  res: express.Response,
  provider: 'anthropic' | 'claude',
) {
  try {
    const body = req.body as MessageCreateParams
    logger.debug('Received request', { body })

    // 必須フィールドのバリデーション
    validateMessagesRequest(body)

    // モデル取得
    const { vsCodeModel } = await getVSCodeModel(body.model, provider)

    // ストリーミングモード判定
    const isStreaming = body.stream === true

    //Anthropicリクエスト→VSCode LM API形式変換
    const { messages, options, inputTokens } =
      await convertAnthropicRequestToVSCodeRequest(body, vsCodeModel)

    // キャンセラレーショントークン作成
    const cancellationToken = new vscode.CancellationTokenSource().token

    // LM APIへリクエスト送信
    const response = await vsCodeModel.sendRequest(
      messages,
      options,
      cancellationToken,
    )
    logger.debug('Received response from LM API')

    // レスポンスをAnthropic形式に変換
    const anthropicResponse = convertVSCodeResponseToAnthropicResponse(
      response,
      vsCodeModel,
      isStreaming,
      inputTokens,
    )
    logger.debug('anthropicResponse', {
      anthropicResponse,
      vsCodeModel,
      isStreaming,
    })

    // ストリーミングレスポンス処理
    if (isStreaming) {
      await handleStreamingResponse(
        res,
        anthropicResponse as AsyncIterable<RawMessageStreamEvent>,
        req.originalUrl || req.url,
      )
      return
    }

    // 非ストリーミングレスポンス処理
    const message = await (anthropicResponse as Promise<Message>)
    logger.debug('message', { message })
    res.json(message)
  } catch (error) {
    const { statusCode, errorObject } = handleMessageError(
      error as vscode.LanguageModelError,
    )
    res.status(statusCode).json({ type: 'error', error: errorObject })
  }
}
