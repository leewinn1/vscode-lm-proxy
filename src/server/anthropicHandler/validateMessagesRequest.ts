import type { MessageCreateParams } from '@anthropic-ai/sdk/resources'
import type * as vscode from 'vscode'

/**
 * Messages APIリクエストの必須フィールドをバリデーションする
 * @param {MessageCreateParams} body
 * @throws エラー時は例外をスロー
 */
export function validateMessagesRequest(body: MessageCreateParams) {
  // messagesフィールドの存在と配列チェック
  if (
    !body.messages ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0
  ) {
    const error: vscode.LanguageModelError = {
      ...new Error('The messages field is required'),
      name: 'InvalidMessageRequest',
      code: 'invalid_request_error',
    }
    throw error
  }

  // modelフィールドの存在チェック
  if (!body.model) {
    const error: vscode.LanguageModelError = {
      ...new Error('The model field is required'),
      name: 'InvalidModelRequest',
      code: 'not_found_error',
    }
    throw error
  }
}
