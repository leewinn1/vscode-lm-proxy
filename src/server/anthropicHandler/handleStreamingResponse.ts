import type { RawMessageStreamEvent } from '@anthropic-ai/sdk/resources'
import type express from 'express'
import type * as vscode from 'vscode'
import { handleMessageError } from '@/server/anthropicHandler/handleMessageError'
import { logger } from '@/utils/logger'

/**
 * ストリーミングレスポンスを処理し、クライアントに送信する
 * @param {express.Response} res
 * @param {AsyncIterable<RawMessageStreamEvent>} stream
 * @param {string} reqPath
 * @returns {Promise<void>}
 */
export async function handleStreamingResponse(
  res: express.Response,
  stream: AsyncIterable<RawMessageStreamEvent>,
  reqPath: string,
): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  logger.debug('Streaming started', { path: reqPath })
  let chunkIndex = 0

  try {
    // ストリーミングレスポンスを逐次送信
    for await (const chunk of stream) {
      const data = JSON.stringify(chunk)
      res.write(`data: ${data}\n\n`)
      logger.debug(`Streaming chunk: ${data}`)
      chunkIndex++
    }

    // 正常終了
    logger.debug('Streaming ended', {
      path: reqPath,
      chunkCount: chunkIndex,
    })
  } catch (error) {
    // エラー発生時はAnthropic互換エラーを送信し、ストリームを終了
    const { errorObject } = handleMessageError(
      error as vscode.LanguageModelError,
    )
    res.write(
      `data: ${JSON.stringify({ type: 'error', error: errorObject })}\n\n`,
    )
    logger.error('Streaming error', { error, path: reqPath })
  } finally {
    // ストリーム終了
    res.end()
  }
}
