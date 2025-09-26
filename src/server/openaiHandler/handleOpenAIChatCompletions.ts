import type express from 'express'
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
} from 'openai/resources'
import * as vscode from 'vscode'
import { convertOpenAIRequestToVSCodeRequest } from '@/converter/openai/convertOpenAIRequestToVSCodeRequest'
import { convertVSCodeResponseToOpenAIResponse } from '@/converter/openai/convertVSCodeResponseToOpenAIResponse'
import { getVSCodeModel } from '@/server/handler'
import { handleChatCompletionError } from '@/server/openaiHandler/handleChatCompletionError'
import { handleStreamingResponse } from '@/server/openaiHandler/handleStreamingResponse'
import { validateChatCompletionRequest } from '@/server/openaiHandler/validateChatCompletionRequest'
import { logger } from '@/utils/logger'

/**
 * OpenAI互換のChat Completions APIリクエストを処理するメイン関数。
 * - リクエストバリデーション
 * - モデル取得
 * - LM APIへのリクエスト送信
 * - ストリーミング/非ストリーミングレスポンス処理
 * - エラーハンドリング
 * @param {express.Request} req リクエスト
 * @param {express.Response} res レスポンス
 * @returns {Promise<void>}
 */
export async function handleOpenAIChatCompletions(
  req: express.Request,
  res: express.Response,
) {
  try {
    const body = req.body as ChatCompletionCreateParams
    logger.debug('Received request', { body })

    // 必須フィールドのバリデーション
    validateChatCompletionRequest(body)

    // モデル取得
    const { vsCodeModel } = await getVSCodeModel(body.model, 'openai')

    // ストリーミングモード判定
    const isStreaming = body.stream === true

    // OpenAIリクエスト→VSCode LM API形式変換
    const { messages, options, inputTokens } =
      await convertOpenAIRequestToVSCodeRequest(body, vsCodeModel)

    // キャンセラレーショントークン作成
    const cancellationToken = new vscode.CancellationTokenSource().token

    // LM APIへリクエスト送信
    const response = await vsCodeModel.sendRequest(
      messages,
      options,
      cancellationToken,
    )
    logger.debug('Received response from LM API')

    // レスポンスをOpenAI形式に変換
    const openAIResponse = convertVSCodeResponseToOpenAIResponse(
      response,
      vsCodeModel,
      isStreaming,
      inputTokens,
    )
    logger.debug('openAIResponse', {
      openAIResponse,
      vsCodeModel,
      isStreaming,
    })

    // ストリーミングレスポンス処理
    if (isStreaming) {
      await handleStreamingResponse(
        res,
        openAIResponse as AsyncIterable<ChatCompletionChunk>,
        req.originalUrl || req.url,
      )
      return
    }

    // 非ストリーミングレスポンス処理
    const completion = await (openAIResponse as Promise<ChatCompletion>)
    logger.debug('completion', { completion })
    res.json(completion)
  } catch (error) {
    const { statusCode, apiError } = handleChatCompletionError(
      error as vscode.LanguageModelError,
    )
    res.status(statusCode).json({ error: apiError })
  }
}
