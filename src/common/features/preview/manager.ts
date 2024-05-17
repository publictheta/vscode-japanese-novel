import * as vscode from "vscode"

import { EXTENSION_LANGUAGE_ID } from "../../const"
import { Disposable } from "../../base/dispose"
import {
    ErrorNotificationId,
    NotificationService,
} from "../../services/notification"
import {
    PREVIEW_CONFIGURATION,
    PreviewConfigurationSection,
    PreviewConfiguration,
    PreviewLayoutConfiguration,
    PreviewStyleConfiguration,
} from "./configuration"
import { Preview } from "./preview"
import { PreviewStore } from "./store"
import { PreviewExtensionContext } from "./context"
import { PreviewContextKey, setContext } from "../../base/context"
import { PREVIEW_VIEW_TYPE, PreviewState } from "./const"

/**
 * プレビューパネルを管理するクラス
 */
export class PreviewManager
    extends Disposable
    implements vscode.WebviewPanelSerializer, vscode.Disposable
{
    context: PreviewExtensionContext
    configuration: PreviewConfiguration
    store: PreviewStore

    activePreview: Preview | undefined = undefined
    visiblePreviews = new Set<Preview>()

    activeEditor: vscode.TextEditor | undefined
    visibleEditors: Set<vscode.TextEditor>

    constructor(context: vscode.ExtensionContext) {
        super()

        this.context = new PreviewExtensionContext(context)
        this.configuration = new PreviewConfiguration()
        this.store = new PreviewStore()

        this.activeEditor = vscode.window.activeTextEditor
        this.visibleEditors = new Set(vscode.window.visibleTextEditors)

        setContext(PreviewContextKey.HasActive, false)
        setContext(PreviewContextKey.ActivePath, "")
        setContext(PreviewContextKey.VisiblePaths, [])

        this.subscriptions.push(
            this.store,
            // Webviewパネルの復元を可能にする
            vscode.window.registerWebviewPanelSerializer(
                PREVIEW_VIEW_TYPE,
                this,
            ),
            // 設定の変更をプレビューに伝える
            vscode.workspace.onDidChangeConfiguration(async event => {
                if (!event.affectsConfiguration(PREVIEW_CONFIGURATION)) {
                    return
                }

                const configuration = vscode.workspace.getConfiguration(
                    PREVIEW_CONFIGURATION,
                )

                if (
                    event.affectsConfiguration(
                        PreviewConfigurationSection.LAYOUT,
                    )
                ) {
                    const layout = new PreviewLayoutConfiguration(configuration)

                    const orientation = layout.orientation

                    if (
                        layout.orientation !==
                        this.configuration.layout.orientation
                    ) {
                        this.configuration.layout = layout

                        for (const preview of this.store) {
                            await preview.updateOrientation(orientation)
                        }
                    }
                }

                if (
                    event.affectsConfiguration(
                        PreviewConfigurationSection.STYLE,
                    )
                ) {
                    const style = new PreviewStyleConfiguration(configuration)

                    if (!style.equals(this.configuration.style)) {
                        this.configuration.style = style

                        for (const preview of this.store) {
                            await preview.updateStyle()
                        }
                    }
                }
            }),
            // ドキュメントの変更をプレビューに伝える
            vscode.workspace.onDidChangeTextDocument(async event => {
                if (event.document.languageId !== EXTENSION_LANGUAGE_ID) {
                    return
                }

                const preview = this.store.byDocument(event.document)

                if (!preview) {
                    return
                }

                await preview.updateContent(event.contentChanges)
            }),
            // ドキュメントのファイル名の変更をプレビューに伝える
            vscode.workspace.onDidRenameFiles(async event => {
                for (const file of event.files) {
                    const oldString = file.oldUri.toString()

                    const preview = this.store.byUri(oldString)

                    if (preview) {
                        this.store.setUri(preview, file.newUri.toString())
                        await preview.updateUri(file.newUri)
                        return
                    }

                    for (const [string, preview] of this.store.uriStrings()) {
                        if (!string.startsWith(oldString)) {
                            continue
                        }

                        await preview.updateUri(
                            vscode.Uri.parse(
                                file.newUri.toString() +
                                    string.slice(oldString.length),
                            ),
                        )
                    }
                }
            }),
            // エディターの選択範囲の変更をプレビューに伝える
            vscode.window.onDidChangeTextEditorSelection(async event => {
                const preview = this.store.byEditor(event.textEditor)

                if (!preview) {
                    return
                }

                await preview.updateSelection(event.textEditor.selection)
            }),
            // エディターの表示範囲の変更をプレビューに伝える
            vscode.window.onDidChangeTextEditorVisibleRanges(async event => {
                const preview = this.store.byEditor(event.textEditor)

                if (!preview) {
                    return
                }

                await preview.updateVisibleRanges(event.visibleRanges)
            }),
            // ドキュメントが閉じられたときプレビューも閉じる
            vscode.workspace.onDidCloseTextDocument(document => {
                const preview = this.store.byDocument(document)

                if (!preview) {
                    return
                }

                preview.panel.dispose()
            }),
            // エディターがアクティブになったとき可能なら既存のプレビューに関連づける
            vscode.window.onDidChangeActiveTextEditor(async editor => {
                if (!editor) {
                    this.activeEditor = undefined
                    return
                }

                if (editor.document.languageId !== EXTENSION_LANGUAGE_ID) {
                    this.activeEditor = undefined
                    return
                }

                let preview = this.store.byEditor(editor)

                if (preview) {
                    return
                }

                preview = this.store.byDocument(editor.document)

                if (preview) {
                    await preview.attach(editor)
                }
            }),
            // エディターが表示されたとき可能なら既存のプレビューに関連づける
            vscode.window.onDidChangeVisibleTextEditors(async editors => {
                const prev = this.visibleEditors
                const next = new Set<vscode.TextEditor>()
                const nextMap = new Map<
                    vscode.TextDocument,
                    vscode.TextEditor
                >()

                for (const editor of editors) {
                    if (editor.document.languageId !== EXTENSION_LANGUAGE_ID) {
                        prev.delete(editor)

                        const preview = this.store.byEditor(editor)

                        if (preview) {
                            await preview.detach()
                        }

                        continue
                    }

                    const preview = this.store.byDocument(editor.document)

                    if (!preview) {
                        prev.delete(editor)
                        continue
                    }

                    next.add(editor)
                    nextMap.set(editor.document, editor)
                    await preview.attach(editor)
                }

                for (const prevEditor of prev) {
                    const preview = this.store.byEditor(prevEditor)

                    if (!preview) {
                        continue
                    }

                    const nextEditor = nextMap.get(preview.document)

                    if (!nextEditor) {
                        continue
                    }

                    await preview.attach(nextEditor)
                }

                this.visibleEditors = next
            }),
        )
    }

    // MARK: コマンド

    async open(uri: vscode.Uri): Promise<void> {
        let preview = this.store.byUri(uri.toString())

        if (preview) {
            preview.reveal()
            return
        }

        const editor = TextEditorInWindow.findByUri(uri)
        let document = editor?.document

        if (!document) {
            document = await vscode.workspace.openTextDocument(uri)
        }

        if (document.languageId !== EXTENSION_LANGUAGE_ID) {
            await NotificationService.showErrorMessage(
                ErrorNotificationId.InvalidLanguageId,
            )
            return
        }

        preview = this.store.byDocument(document)

        if (!preview) {
            Preview.create(
                this,
                document,
                editor,
                editor && vscode.window.activeTextEditor === editor
                    ? vscode.ViewColumn.Beside
                    : vscode.ViewColumn.Active,
            )
            return
        }

        preview.reveal()

        if (editor && preview.editor !== editor) {
            await preview.attach(editor)
        }
    }

    async openToSide(editor: vscode.TextEditor): Promise<void> {
        const document = editor.document

        if (document.languageId !== EXTENSION_LANGUAGE_ID) {
            await NotificationService.showErrorMessage(
                ErrorNotificationId.InvalidLanguageId,
            )
            return
        }

        const preview = this.store.byDocument(document)

        if (!preview) {
            Preview.create(this, document, editor, vscode.ViewColumn.Beside)
            return
        }

        preview.reveal(vscode.ViewColumn.Beside)

        if (editor && preview.editor !== editor) {
            await preview.attach(editor)
        }
    }

    // MARK: `vscode.WebviewPanelSerializer`

    // Webviewパネルの状態を復元する
    async deserializeWebviewPanel(
        panel: vscode.WebviewPanel,
        state: PreviewState,
    ): Promise<void> {
        const uri = vscode.Uri.parse(state.uri)

        const editor = TextEditorInWindow.findByUri(uri)
        let document = editor?.document

        if (!document) {
            document = await vscode.workspace.openTextDocument(uri)
        }

        if (document.languageId !== EXTENSION_LANGUAGE_ID) {
            await NotificationService.showErrorMessage(
                ErrorNotificationId.InvalidLanguageId,
            )
            return
        }

        Preview.create(this, document, editor, panel)
    }

    // MARK: View State

    setActive(preview: Preview, value: boolean) {
        preview.active = value

        if (value) {
            this.activePreview = preview
            setContext(PreviewContextKey.HasActive, true)
            setContext(PreviewContextKey.ActivePath, preview.document.uri.path)
        } else if (this.activePreview == preview) {
            this.activePreview = undefined
            setContext(PreviewContextKey.HasActive, false)
            setContext(PreviewContextKey.ActivePath, "")
        }
    }

    setVisible(preview: Preview, value: boolean) {
        preview.visible = value

        if (value) {
            this.visiblePreviews.add(preview)
            setContext(
                PreviewContextKey.VisiblePaths,
                Array.from(this.visiblePreviews.values()).map(
                    preview => preview.document.uri.path,
                ),
            )
        } else {
            this.visiblePreviews.delete(preview)
            setContext(
                PreviewContextKey.VisiblePaths,
                Array.from(this.visiblePreviews.values()).map(
                    preview => preview.document.uri.path,
                ),
            )
        }
    }
}

namespace TextEditorInWindow {
    export function find(
        predicate: (editor: vscode.TextEditor) => boolean,
    ): vscode.TextEditor | undefined {
        const active = vscode.window.activeTextEditor

        if (active && predicate(active)) {
            return active
        }

        for (const editor of vscode.window.visibleTextEditors) {
            if (predicate(editor)) {
                return editor
            }
        }

        return undefined
    }

    export function findByUri(uri: vscode.Uri): vscode.TextEditor | undefined {
        const string = uri.toString()
        return find(editor => editor.document.uri.toString() === string)
    }
}
