import type { ChatCompletionCreateParams } from 'openai/resources'
import type * as vscode from 'vscode'

/**
 * Chat Completions APIリクエストの必須フィールドをバリデーションする
 * @param {ChatCompletionCreateParams} body
 * @throws エラー時は例外をスロー
 */
export function validateChatCompletionRequest(
  body: ChatCompletionCreateParams,
) {
  // messagesフィールドの存在と配列チェック
  if (
    !body.messages ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0
  ) {
    const error: vscode.LanguageModelError = {
      ...new Error('The messages field is required'),
      name: 'InvalidMessageRequest',
      code: 'invalid_message_format',
    }
    throw error
  }

  // modelフィールドの存在チェック
  if (!body.model) {
    const error: vscode.LanguageModelError = {
      ...new Error('The model field is required'),
      name: 'InvalidModelRequest',
      code: 'invalid_model',
    }
    throw error
  }
}
