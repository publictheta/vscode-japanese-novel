import * as vscode from "vscode"

import {
    EXTENSION_LANGUAGE_ID,
    MARKDOWN_LANGUAGE_ID,
    EXTENSION_ID,
} from "../const"
import { TextEditorCommand } from "../base/command"
import {
    CHAR_FULLWIDTH_VERTICAL_BAR,
    CHAR_HALFWIDTH_VERTICAL_BAR,
    REGEX_ALL_HAN,
    REGEX_SPECIAL,
} from "../base/string"
import {
    ErrorNotificationId,
    NotificationService,
} from "../services/notification"

export const COMMAND_INSERT_RUBY = `${EXTENSION_ID}.insertRuby`
export const COMMAND_INSERT_DOTS = `${EXTENSION_ID}.insertDots`

export const enum VerticalBarKind {
    Full = "full",
    Half = "half",
}

export const enum VerticalBarInsert {
    Default = "default",
    Always = "always",
    OnlyWhenNeeded = "onlyWhenNeeded",
}

export const INSERT_RUBY_CONFIGURATION = `${EXTENSION_ID}.commands.insertRuby`

export const enum InsertRubyConfigurationField {
    VERTICAL_BAR_INSERT = "verticalBar.insert",
    VERTICAL_BAR_KIND = "verticalBar.kind",
}

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
        prefix: string,
    ) => number,
): Promise<void> {
    switch (editor.document.languageId) {
        case EXTENSION_LANGUAGE_ID:
        case MARKDOWN_LANGUAGE_ID:
            break
        default:
            await NotificationService.showErrorMessage(
                ErrorNotificationId.InvalidLanguageId,
            )
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
                    ErrorNotificationId.EditNotSingleLine,
                )
                break
            default:
                await NotificationService.showErrorMessage(
                    ErrorNotificationId.EditContainSpecialCharacter,
                )
        }
        return
    }

    const prefix = editor.document.getText(
        new vscode.Range(
            new vscode.Position(selection.start.line, 0),
            selection.start,
        ),
    )

    let delta = 0

    const ok = await editor.edit(edit => {
        delta = f(edit, selection, text, prefix)
    })

    if (ok) {
        const cursor = selection.end.translate(0, delta)
        editor.selection = new vscode.Selection(cursor, cursor)
    } else {
        await NotificationService.showErrorMessage(
            ErrorNotificationId.EditOther,
        )
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
                const configuration = vscode.workspace.getConfiguration(
                    INSERT_RUBY_CONFIGURATION,
                )

                function getBar() {
                    const barKind = configuration.get<VerticalBarKind>(
                        InsertRubyConfigurationField.VERTICAL_BAR_KIND,
                        VerticalBarKind.Full,
                    )

                    return barKind === VerticalBarKind.Half
                        ? CHAR_HALFWIDTH_VERTICAL_BAR
                        : CHAR_FULLWIDTH_VERTICAL_BAR
                }

                function getInsertAlways() {
                    return (
                        configuration.get<VerticalBarInsert>(
                            InsertRubyConfigurationField.VERTICAL_BAR_INSERT,
                            VerticalBarInsert.Default,
                        ) !== VerticalBarInsert.OnlyWhenNeeded
                    )
                }

                // # 実装
                //
                // - 状態: テキストが未選択か選択済か
                // - 状態: （未選択なら）直前が漢字か漢字以外か
                // - 状態: （選択済なら）選択中のテキストが漢字のみか
                // - 設定: 縦棒の挿入が常時か必要時のみか
                //
                // から、
                //
                // - 縦棒を挿入するか
                // - カーソル位置をどれだけ動かすか
                //
                // を決める。
                //
                // 分岐をすべて書き出すと次のようになる。
                //
                // - 未選択:
                //     - 直前漢字 -> 縦棒なしで括弧の中へ
                //         - delta = 1
                //     - それ以外:
                //         - 常時 -> 縦棒ありで括弧の前へ
                //             - insert(bar)
                //             - delta = 1
                //         - 必要時 -> 縦棒なしで括弧の中へ
                //             - delta = 1
                // - 選択済:
                //     - 常時 -> 縦棒ありで括弧の中へ
                //         - insert(bar)
                //         - delta = 2
                //     - 必要時:
                //         - 選択漢字のみ -> 縦棒なしで括弧の中へ
                //             - delta = 1
                //         - それ以外含む -> 縦棒ありで括弧の中へ
                //             - insert(bar)
                //             - delta = 2
                //
                // これを整理すると次のようなコードになる。

                let delta = 1
                let insertBar = false

                if (selection.isEmpty) {
                    if (
                        !(
                            prefix.length > 0 &&
                            REGEX_ALL_HAN.test(prefix.slice(-1))
                        ) &&
                        getInsertAlways()
                    ) {
                        insertBar = true
                    }
                } else {
                    if (!REGEX_ALL_HAN.test(text) || getInsertAlways()) {
                        insertBar = true
                        delta += 1
                    }
                }

                if (insertBar) {
                    edit.insert(selection.start, getBar())
                }

                edit.insert(selection.end, "《》")
                return delta
            },
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
            return selection.isEmpty ? 2 : 4
        })
    }
}
