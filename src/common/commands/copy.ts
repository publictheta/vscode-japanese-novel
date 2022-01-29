import * as vscode from "vscode"

import {
    COMMAND_COPY_AS_HTML,
    COMMAND_COPY_AS_RUBY_ONLY,
    EXTENSION_LANGUAGE_ID,
} from "../base/consts"
import { UriCommand } from "../base/command"
import { linesToHTML, toRubyOnly } from "../base/string"
import { NotificationService } from "../services/notification"

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
            await NotificationService.showErrorMessage("errorInvalidLanguageId")
            return
        }

        const text = this.convert(document.getText())

        await vscode.env.clipboard.writeText(text)

        if (text !== (await vscode.env.clipboard.readText())) {
            await NotificationService.showErrorMessage("errorCopyClipboard")
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
        await NotificationService.showInformationMessage("infoCopyAsRubyOnly")
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
        await NotificationService.showInformationMessage("infoCopyAsHTML")
    }
}
