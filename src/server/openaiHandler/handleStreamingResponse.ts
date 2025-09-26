import type express from 'express'
import type { ChatCompletionChunk } from 'openai/resources'
import type * as vscode from 'vscode'
import { handleChatCompletionError } from '@/server/openaiHandler/handleChatCompletionError'
import { logger } from '@/utils/logger'

/**
 * ストリーミングレスポンスを処理し、クライアントに送信する
 * @param {express.Response} res
 * @param {AsyncIterable<ChatCompletionChunk>} stream
 * @param {string} reqPath
 * @returns {Promise<void>}
 */
export async function handleStreamingResponse(
  res: express.Response,
  stream: AsyncIterable<ChatCompletionChunk>,
  reqPath: string,
) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  logger.debug('Streaming started', { stream: 'start', path: reqPath })
  let chunkIndex = 0

  try {
    // ストリーミングレスポンスを逐次送信
    for await (const chunk of stream) {
      const data = JSON.stringify(chunk)
      res.write(`data: ${data}\n\n`)
      logger.debug(
        `Streaming chunk: ${JSON.stringify({ stream: 'chunk', chunk, index: chunkIndex++ })}`,
      )
    }

    // 正常終了
    res.write('data: [DONE]\n\n')
    logger.debug('Streaming ended', {
      stream: 'end',
      path: reqPath,
      chunkCount: chunkIndex,
    })
  } catch (error) {
    // エラー発生時はOpenAI互換エラーを送信し、ストリームを終了
    const { apiError } = handleChatCompletionError(
      error as vscode.LanguageModelError,
    )
    res.write(`data: ${JSON.stringify({ error: apiError })}\n\n`)
    res.write('data: [DONE]\n\n')
    logger.error('Streaming error', { error, path: reqPath })
  } finally {
    // ストリーム終了
    res.end()
  }
}
