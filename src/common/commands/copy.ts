import * as vscode from "vscode"

import { EXTENSION_ID, EXTENSION_LANGUAGE_ID } from "../const"
import { UriCommand } from "../base/command"
import { linesToHTML, toRubyOnly } from "../base/string"
import {
    ErrorNotificationId,
    InfoNotificationId,
    NotificationService,
} from "../services/notification"

export const COMMAND_COPY_AS_HTML = `${EXTENSION_ID}.copyAsHTML`
export const COMMAND_COPY_AS_RUBY_ONLY = `${EXTENSION_ID}.copyAsRubyOnly`

/**
 * テキストをクリップボードへとコピーするコマンド
 */
export abstract class CopyCommand extends UriCommand {
    constructor() {
        super()
    }

    async executeUri(uri: vscode.Uri): Promise<void> {
        const document = await vscode.workspace.openTextDocument(uri)

        if (document.languageId !== EXTENSION_LANGUAGE_ID) {
            await NotificationService.showErrorMessage(
                ErrorNotificationId.InvalidLanguageId,
            )
            return
        }

        const text = this.convert(document.getText())

        await vscode.env.clipboard.writeText(text)

        if (text !== (await vscode.env.clipboard.readText())) {
            await NotificationService.showErrorMessage(
                ErrorNotificationId.CopyClipboard,
            )
            return
        }

        await this.done()
    }

    abstract convert(string: string): string
    abstract done(): Promise<void>
}

/**
 * テキストをルビのみに変換してクリップボードへとコピーするコマンド
 */
export class CopyAsRubyOnlyCommand extends CopyCommand {
    readonly id = COMMAND_COPY_AS_RUBY_ONLY

    convert(string: string): string {
        return toRubyOnly(string)
    }

    async done(): Promise<void> {
        await NotificationService.showInformationMessage(
            InfoNotificationId.CopyAsRubyOnly,
        )
    }
}

/**
 * テキストをHTMLに変換してクリップボードへとコピーするコマンド
 */
export class CopyAsHTMLCommand extends CopyCommand {
    readonly id = COMMAND_COPY_AS_HTML

    convert(string: string): string {
        return linesToHTML(string)
    }

    async done(): Promise<void> {
        await NotificationService.showInformationMessage(
            InfoNotificationId.CopyAsHTML,
        )
    }
}
