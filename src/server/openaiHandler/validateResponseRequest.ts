import type { ResponseCreateParams } from 'openai/resources/responses/responses'
import type * as vscode from 'vscode'

/**
 * Responses APIリクエストの必須フィールドをバリデーションする
 * @param {ResponseCreateParams} body
 * @throws エラー時は例外をスロー
 */
export function validateResponseRequest(body: ResponseCreateParams) {
  // inputフィールドの存在と配列チェック
  if (!body.input || body.input.length === 0) {
    const error: vscode.LanguageModelError = {
      ...new Error('The input field is required'),
      name: 'InvalidInputRequest',
      code: 'invalid_input_format',
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
