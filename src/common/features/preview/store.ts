import * as vscode from "vscode"

import { BiMap } from "../../base/collections"
import { Disposable } from "../../base/dispose"
import { Preview } from "./preview"

/**
 * プレビューパネルを保持するクラス
 */
export class PreviewStore extends Disposable implements vscode.Disposable {
    private previews: Set<Preview> = new Set()

    private mapUriString = new BiMap<string, Preview>()
    private mapDocument = new BiMap<vscode.TextDocument, Preview>()
    private mapEditor = new BiMap<vscode.TextEditor, Preview>()

    override dispose() {
        for (const preview of this.previews.values()) {
            preview.dispose()
        }

        this.previews.clear()
        this.mapUriString.clear()
        this.mapDocument.clear()
        this.mapEditor.clear()

        super.dispose()
    }

    [Symbol.iterator]() {
        return this.previews[Symbol.iterator]()
    }

    /**
     * プレビューパネルの登録を追加する
     *
     * @param preview プレビューパネル
     * @param document プレビューパネルに関連づけられたドキュメント
     * @param editor プレビューパネルに関連づけられたエディター
     */
    add(
        preview: Preview,
        document: vscode.TextDocument,
        editor?: vscode.TextEditor,
    ): void {
        this.previews.add(preview)
        this.mapUriString.set(document.uri.toString(), preview)
        this.mapDocument.set(document, preview)

        if (editor) {
            this.mapEditor.set(editor, preview)
        }
    }

    /**
     * プレビューパネルの登録を削除する
     *
     * @param preview プレビューパネル
     */
    delete(preview: Preview): void {
        this.previews.delete(preview)
        this.mapUriString.deleteReverse(preview)
        this.mapDocument.deleteReverse(preview)
        this.mapEditor.deleteReverse(preview)
    }

    uriStrings() {
        return this.mapUriString.entries()
    }

    byEditor(editor: vscode.TextEditor): Preview | undefined {
        return this.mapEditor.get(editor)
    }

    byDocument(document: vscode.TextDocument): Preview | undefined {
        return this.mapDocument.get(document)
    }

    byUri(uri: string): Preview | undefined {
        return this.mapUriString.get(uri)
    }

    setUri(preview: Preview, uri: string): void {
        this.mapUriString.deleteReverse(preview)
        this.mapUriString.set(uri, preview)
    }

    hasEditor(editor: vscode.TextEditor): boolean {
        return this.mapEditor.has(editor)
    }

    setEditor(preview: Preview, editor: vscode.TextEditor): void {
        this.mapEditor.deleteReverse(preview)
        this.mapEditor.set(editor, preview)
        preview.editor = editor
    }

    deleteEditor(preview: Preview): void {
        if (preview.editor) {
            this.mapEditor.delete(preview.editor)
        } else {
            this.mapEditor.deleteReverse(preview)
        }

        preview.editor = undefined
    }
}
