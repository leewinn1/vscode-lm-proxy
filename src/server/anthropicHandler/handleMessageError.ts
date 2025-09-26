import type { ErrorObject } from '@anthropic-ai/sdk/resources'
import type * as vscode from 'vscode'
import { logger } from '@/utils/logger'

/**
 * VSCode LanguageModelError を Anthropic 互換エラー形式に変換し、ログ出力する
 * @param {vscode.LanguageModelError} error
 * @returns { statusCode: number, errorObject: ErrorObject }
 */
export function handleMessageError(error: vscode.LanguageModelError): {
  statusCode: number
  errorObject: ErrorObject
} {
  logger.error('VSCode LM API error', error, {
    cause: error.cause,
    code: error.code,
    message: error.message,
    name: error.name,
    stack: error.stack,
  })

  // 変数を定義
  let statusCode = 500
  let type: ErrorObject['type'] = 'api_error'
  let message = error.message || 'An unknown error has occurred'

  // LanguageModelError.name に応じてマッピング
  switch (error.name) {
    case 'InvalidMessageFormat':
    case 'InvalidModel':
      statusCode = 400
      type = 'invalid_request_error'
      break
    case 'NoPermissions':
      statusCode = 403
      type = 'permission_error'
      break
    case 'Blocked':
      statusCode = 403
      type = 'permission_error'
      break
    case 'NotFound':
      statusCode = 404
      type = 'not_found_error'
      break
    case 'ChatQuotaExceeded':
      statusCode = 429
      type = 'rate_limit_error'
      break
    case 'Error': {
      // エラーコード（数値）とJSON部分を抽出し、変数に格納
      const match = error.message.match(/Request Failed: (\d+)\s+({.*})/)

      if (match) {
        const status = Number(match[1])
        const jsonString = match[2]
        const errorJson = JSON.parse(jsonString)
        console.log(status)
        console.log(errorJson)

        statusCode = status
        type = errorJson.error.type
        message = errorJson.error.message
      }

      break
    }
    case 'Unknown':
      statusCode = 500
      type = 'api_error'
      break
  }

  // Anthropic互換エラー形式で返却
  const errorObject: ErrorObject = {
    type,
    message,
  }

  return { statusCode, errorObject }
}
