import * as vscode from "vscode"

import {
    COMMAND_OPEN_PREVIEW,
    COMMAND_OPEN_PREVIEW_SOURCE,
    COMMAND_OPEN_PREVIEW_TO_SIDE,
} from "../base/consts"
import { UriCommand, TextEditorCommand, Command } from "../base/command"
import { PreviewManager } from "../features/preview"

/**
 * プレビューをアクティブなパネルで開くコマンド
 */
export class OpenPreviewCommand extends UriCommand {
    readonly id = COMMAND_OPEN_PREVIEW

    constructor(readonly preview: PreviewManager) {
        super()
    }

    async executeUri(uri: vscode.Uri): Promise<void> {
        await this.preview.open(uri)
    }
}

/**
 * プレビューをサイドのパネルで開くコマンド
 */
export class OpenPreviewToSideCommand extends TextEditorCommand {
    readonly id = COMMAND_OPEN_PREVIEW_TO_SIDE

    constructor(readonly preview: PreviewManager) {
        super()
    }

    async executeTextEditor(editor: vscode.TextEditor): Promise<void> {
        await this.preview.openToSide(editor)
    }
}

/**
 * プレビューのソースを開くコマンド
 */
export class OpenPreviewSource extends Command {
    readonly id: string = COMMAND_OPEN_PREVIEW_SOURCE
    readonly isTextEditor = false

    constructor(readonly preview: PreviewManager) {
        super()
    }

    async execute(): Promise<void> {
        const preview = this.preview.activePreview

        if (!preview) {
            return
        }

        await vscode.window.showTextDocument(
            preview.document,
            preview.editor?.viewColumn,
            false
        )
    }
}
