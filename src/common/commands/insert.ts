import * as vscode from "vscode"

import {
    COMMAND_CONFIGURATION_INSERT_RUBY_FIELD,
    COMMAND_CONFIGURATION_SECTION,
    COMMAND_INSERT_DOTS,
    COMMAND_INSERT_RUBY,
    EXTENSION_LANGUAGE_ID,
    MARKDOWN_LANGUAGE_ID,
    type VerticalBarInsert,
    type VerticalBarKind,
    VERTICAL_BAR_INSERT,
    VERTICAL_BAR_KIND,
} from "../base/consts"
import { TextEditorCommand } from "../base/command"
import {
    CHAR_FULLWIDTH_VERTICAL_BAR,
    CHAR_HALFIWIDTH_VERTICAL_BAR,
    REGEX_ALL_HAN,
    REGEX_SPECIAL,
} from "../base/string"
import { NotificationService } from "../services/notification"

/**
 * 選択範囲を伴った行内の編集を実行する
 *
 * @param editor
 * @param f 編集を実行する関数。返値は選択範囲の終端から実行後のカーソル位置へのデルタ。
 * @returns
 */
async function executeLineEditWithSelection(
    editor: vscode.TextEditor,
    f: (
        /**
         * 編集のビルダー
         */
        edit: vscode.TextEditorEdit,
        /**
         * 選択範囲
         */
        selection: vscode.Selection,
        /**
         * 選択範囲のテキスト
         */
        text: string,
        /**
         * 選択範囲の直前のテキスト
         */
        prefix: string
    ) => number
): Promise<void> {
    switch (editor.document.languageId) {
        case EXTENSION_LANGUAGE_ID:
        case MARKDOWN_LANGUAGE_ID:
            break
        default:
            await NotificationService.showErrorMessage("errorInvalidLanguageId")
            return
    }

    const selection = editor.selection
    const text = editor.document.getText(selection)

    const match = text.match(REGEX_SPECIAL)

    if (match) {
        switch (match[0]) {
            case "\n":
            case "\r":
                await NotificationService.showErrorMessage(
                    "errorEditNotSingleLine"
                )
                break
            default:
                await NotificationService.showErrorMessage(
                    "errorEditContainSpecialCharacter"
                )
        }
        return
    }

    const prefix = editor.document.getText(
        new vscode.Range(
            new vscode.Position(selection.start.line, 0),
            selection.start
        )
    )

    let delta = 0

    const ok = await editor.edit(edit => {
        delta = f(edit, selection, text, prefix)
    })

    if (ok) {
        const cursor = selection.end.translate(0, delta)
        editor.selection = new vscode.Selection(cursor, cursor)
    } else {
        await NotificationService.showErrorMessage("errorEditOther")
    }
}

/**
 * ルビを挿入するコマンド
 */
export class InsertRubyCommand extends TextEditorCommand {
    readonly id = COMMAND_INSERT_RUBY

    async executeTextEditor(editor: vscode.TextEditor): Promise<void> {
        await executeLineEditWithSelection(
            editor,
            (edit, selection, text, prefix) => {
                const config = vscode.workspace.getConfiguration(
                    COMMAND_CONFIGURATION_SECTION.INSERT_RUBY
                )

                const insert = config.get<VerticalBarInsert>(
                    COMMAND_CONFIGURATION_INSERT_RUBY_FIELD.VERTICAL_BAR_INSERT,
                    VERTICAL_BAR_INSERT.DEFAULT
                )

                if (
                    insert !== VERTICAL_BAR_INSERT.ALWAYS &&
                    REGEX_ALL_HAN.test(text) &&
                    !REGEX_ALL_HAN.test(prefix.slice(-1))
                ) {
                    edit.insert(selection.end, "《》")
                    return 1
                } else {
                    const kind = config.get<VerticalBarKind>(
                        COMMAND_CONFIGURATION_INSERT_RUBY_FIELD.VERTICAL_BAR_KIND,
                        VERTICAL_BAR_KIND.FULL
                    )

                    edit.insert(
                        selection.start,
                        kind === VERTICAL_BAR_KIND.HALF
                            ? CHAR_HALFIWIDTH_VERTICAL_BAR
                            : CHAR_FULLWIDTH_VERTICAL_BAR
                    )
                    edit.insert(selection.end, "《》")
                    return 2
                }
            }
        )
    }
}

/**
 * 傍点を挿入するコマンド
 */
export class InsertDotsCommand extends TextEditorCommand {
    readonly id = COMMAND_INSERT_DOTS

    async executeTextEditor(editor: vscode.TextEditor): Promise<void> {
        await executeLineEditWithSelection(editor, (edit, selection) => {
            edit.insert(selection.start, "《《")
            edit.insert(selection.end, "》》")
            return selection.start === selection.end ? 2 : 4
        })
    }
}
