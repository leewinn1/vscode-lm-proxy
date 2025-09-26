import type {
  MessageCreateParams,
  MessageTokensCount,
} from '@anthropic-ai/sdk/resources'
import type express from 'express'
import type * as vscode from 'vscode'
import { handleMessageError } from '@/server/anthropicHandler/handleMessageError'
import { getVSCodeModel } from '@/server/handler'
import { logger } from '@/utils/logger'

/**
 * Anthropic互換のトークン数カウントAPIリクエストを処理する
 * @param {express.Request} req リクエスト
 * @param {express.Response} res レスポンス
 * @param {string} provider プロバイダー ('anthropic' | 'claude')
 * @returns {Promise<void>}
 */
export async function handleAnthropicCountTokens(
  req: express.Request,
  res: express.Response,
  provider: 'anthropic' | 'claude',
) {
  try {
    const body = req.body as MessageCreateParams
    logger.debug('Received count_tokens request', { body })

    // VSCodeモデル取得
    const { vsCodeModel } = await getVSCodeModel(body.model, provider)

    // 対象テキストを定義
    let inputTokens = 0

    // messages
    for (const message of body.messages) {
      // role
      inputTokens += await vsCodeModel.countTokens(message.role)

      // content
      if (typeof message.content === 'string') {
        inputTokens += await vsCodeModel.countTokens(message.content)
      } else {
        const content = message.content
          .map(part => JSON.stringify(part))
          .join(' ')
        inputTokens += await vsCodeModel.countTokens(content)
      }
    }

    // system
    if (body.system) {
      if (typeof body.system === 'string') {
        inputTokens += await vsCodeModel.countTokens(body.system)
      } else {
        const text = body.system.map(part => part.text).join(' ')
        inputTokens += await vsCodeModel.countTokens(text)
      }
    }

    // tools
    if (body.tools) {
      for (const tool of body.tools) {
        // name
        inputTokens += await vsCodeModel.countTokens(tool.name)

        // description
        if ('description' in tool && tool.description) {
          inputTokens += await vsCodeModel.countTokens(tool.description)
        }

        // input_schema
        if ('input_schema' in tool) {
          const inputSchema = JSON.stringify(tool.input_schema)
          inputTokens += await vsCodeModel.countTokens(inputSchema)
        }
      }
    }

    // レスポンスオブジェクトを作成
    const messageTokenCount: MessageTokensCount = {
      input_tokens: inputTokens,
    }
    logger.debug({ messageTokenCount })

    // レスポンス返却
    res.json(messageTokenCount)
  } catch (error) {
    const { statusCode, errorObject } = handleMessageError(
      error as vscode.LanguageModelError,
    )
    res.status(statusCode).json({ type: 'error', error: errorObject })
  }
}
