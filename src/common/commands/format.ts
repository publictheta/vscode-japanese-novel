import * as vscode from "vscode"

import { EXTENSION_ID, EXTENSION_LANGUAGE_ID } from "../const"
import { TextEditorCommand } from "../base/command"
import {
    CHAR_FULLWIDTH_SPACE,
    REGEX_SPACE_AT_LINE_START,
    REGEX_SPACE_AND_CHAR_AT_LINE_START,
} from "../base/string"
import {
    ErrorNotificationId,
    NotificationService,
} from "../services/notification"

export const COMMAND_FORMAT_WITH_INDENTATION = `${EXTENSION_ID}.formatWithIndentation`
export const COMMAND_FORMAT_WITHOUT_INDENTATION = `${EXTENSION_ID}.formatWithoutIndentation`

/**
 * 各行への編集を実行する
 * @param editor
 * @param edit
 * @param f 行を編集する関数
 * @returns
 */
async function executeEditForEachLine(
    editor: vscode.TextEditor,
    edit: vscode.TextEditorEdit,
    f: (line: vscode.TextLine, edit: vscode.TextEditorEdit) => void,
): Promise<void> {
    if (editor.document.languageId !== EXTENSION_LANGUAGE_ID) {
        await NotificationService.showErrorMessage(
            ErrorNotificationId.InvalidLanguageId,
        )
        return
    }

    const document = editor.document

    let start: number
    let end: number

    if (editor.selection.isEmpty) {
        start = 0
        end = document.lineCount - 1
    } else {
        start = editor.selection.start.line
        end = editor.selection.end.line
    }

    for (let i = start; i <= end; i++) {
        f(document.lineAt(i), edit)
    }
}

/**
 * 字下げありで整形するコマンド
 */
export class FormatWithIndentationCommand extends TextEditorCommand {
    id: string = COMMAND_FORMAT_WITH_INDENTATION

    async executeTextEditor(
        editor: vscode.TextEditor,
        edit: vscode.TextEditorEdit,
    ): Promise<void> {
        await executeEditForEachLine(editor, edit, (line, edit) => {
            const match = line.text.match(REGEX_SPACE_AND_CHAR_AT_LINE_START)

            if (!match || match.length < 3) {
                return
            }

            const space = match[1]
            const start = match[2]

            // 行最初の文字が記号
            if (start) {
                // 行頭のスペースを削除
                if (space) {
                    const range = new vscode.Range(
                        line.range.start,
                        line.range.start.with(undefined, space.length),
                    )

                    edit.delete(range)
                }

                return
            }

            // 行頭のスペースを全角スペースに置換
            if (space) {
                const range = new vscode.Range(
                    line.range.start,
                    line.range.start.with(undefined, space.length),
                )

                edit.replace(range, CHAR_FULLWIDTH_SPACE)
                return
            }

            // 行頭に全角スペースを挿入
            edit.insert(line.range.start, CHAR_FULLWIDTH_SPACE)
        })
    }
}

/**
 * 字下げなしで整形するコマンド
 */
export class FormatWithoutIndentationCommand extends TextEditorCommand {
    id: string = COMMAND_FORMAT_WITHOUT_INDENTATION

    async executeTextEditor(
        editor: vscode.TextEditor,
        edit: vscode.TextEditorEdit,
    ): Promise<void> {
        await executeEditForEachLine(editor, edit, (line, edit) => {
            const match = line.text.match(REGEX_SPACE_AT_LINE_START)

            if (!match || match.length < 2) {
                return
            }

            const space = match[1]

            // 行頭のスペースを削除
            if (space) {
                const range = new vscode.Range(
                    line.range.start,
                    line.range.start.with(undefined, space.length),
                )

                edit.delete(range)
            }
        })
    }
}
