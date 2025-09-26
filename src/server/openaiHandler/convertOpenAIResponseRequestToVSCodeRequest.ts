import type { ResponseCreateParams } from 'openai/resources/responses/responses'
import * as vscode from 'vscode'
import { logger } from '@/utils/logger'

export async function convertOpenAIResponseRequestToVSCodeRequest(
  openaiRequest: ResponseCreateParams,
  vsCodeModel: vscode.LanguageModelChat,
) {
  logger.debug('Converting OpenAI chat response request to VSCode request')

  // OpenAIのinputをVSCodeのLanguageModelChatMessage[]に変換
  const messages: vscode.LanguageModelChatMessage[] = []

  // inputがundefinedの場合は何もしない(空配列を返す)
  if (!openaiRequest.input) {
  }

  // inputがstringの場合
  else if (typeof openaiRequest.input === 'string') {
    const role = vscode.LanguageModelChatMessageRole.User
    const content = openaiRequest.input
    const name = 'User'

    messages.push(new vscode.LanguageModelChatMessage(role, content, name))
  }

  // inputがResponseInput(配列)の場合
  else {
    openaiRequest.input.map(item => {
      const role: vscode.LanguageModelChatMessageRole =
        vscode.LanguageModelChatMessageRole.User
      const content:
        | string
        | Array<
            | vscode.LanguageModelTextPart
            | vscode.LanguageModelToolResultPart
            | vscode.LanguageModelToolCallPart
          > = ''
      const prefix = ''
      const name = 'Assistant'

      // typeごとに処理を分岐
      switch (item.type) {
        // messageの場合
        case 'message':
          // WIP
          break
      }

      return new vscode.LanguageModelChatMessage(role, content, name)
    })
  }
}
