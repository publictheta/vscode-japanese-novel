import * as vscode from "vscode"

import {
    Orientation,
    PREVIEW_CSS_CLASS_NAME_CONTAINER,
    PREVIEW_CSS_PROPERTY_NAME_FONT_FAMILY,
    PREVIEW_CSS_PROPERTY_NAME_FONT_SIZE,
    PREVIEW_CSS_PROPERTY_NAME_LINE_HEIGHT,
    PREVIEW_VIEW_TYPE,
    PREVIEW_WEBVIEW_CSS_PATH,
    PREVIEW_WEBVIEW_JS_PATH,
} from "../../base/consts"
import { Disposable } from "../../base/dispose"
import { TextRange, TextSelection } from "../../base/position"
import { getLocalization } from "../../i18n"
import { PreviewManager } from "./manager"
import {
    ExtensionMessage,
    OrientationChangeMessage,
    PatchMessage,
    ReloadMessage,
    SelectionChangeMessage,
    StyleChangeMessage,
    UriChangeMessage,
    VisibleRangesChangeMessage,
} from "./messages/extension"
import {
    WebviewMessage,
    REQUEST_RELOAD_MESSAGE,
    REQUEST_REVEAL_EDITOR_MESSAGE,
} from "./messages/webview"

/**
 * プレビューが永続化する状態
 */
export type PreviewState = {
    uri: string
}

/**
 * プレビューのWebviewに挿入するスタイル
 */
export type PreviewStyle = {
    /**
     * CSSのテキスト
     */
    styles: string[]
    /**
     * CSSのURI
     */
    sheets: string[]
}

/**
 * プレビューパネル
 */
export class Preview extends Disposable implements vscode.Disposable {
    manager: PreviewManager
    panel: vscode.WebviewPanel
    document: vscode.TextDocument
    editor: vscode.TextEditor | undefined

    active: boolean
    visible: boolean

    static create(
        manager: PreviewManager,
        document: vscode.TextDocument,
        editor: vscode.TextEditor | undefined,
        options: vscode.ViewColumn | vscode.WebviewPanel
    ): Preview {
        const uri = document.uri

        let panel: vscode.WebviewPanel

        if (typeof options === "number") {
            panel = vscode.window.createWebviewPanel(
                PREVIEW_VIEW_TYPE,
                Preview.createTitle(uri),
                options,
                {
                    enableScripts: true,
                    enableForms: false,
                }
            )
        } else {
            panel = options
            panel.title = Preview.createTitle(document.uri)
        }

        const preview = new Preview(manager, panel, document, editor)

        const localication = getLocalization()

        const src = panel.webview.asWebviewUri(
            manager.context.getExtensionUri(PREVIEW_WEBVIEW_JS_PATH)
        )

        panel.webview.html =
            `<!DOCTYPE html>` +
            `<html lang="${localication.LANG}">` +
            `<head>` +
            `<meta charset="utf-8">` +
            `<meta name="viewport" content="width=device-width,initial-scale=1.0">` +
            `<title>${localication.PREVIEW_TITLE_PLACEHOLDER}</title>` +
            `<script defer src="${src.toString()}"></script>` +
            `</head>` +
            `<body>` +
            `<div class="${PREVIEW_CSS_CLASS_NAME_CONTAINER}"><p>${localication.PREVIEW_LOADING_MESSAGE}</p></div>` +
            `</body>` +
            `</html>`

        return preview
    }

    private constructor(
        manager: PreviewManager,
        panel: vscode.WebviewPanel,
        document: vscode.TextDocument,
        editor: vscode.TextEditor | undefined
    ) {
        super()

        this.manager = manager
        this.panel = panel
        this.document = document
        this.editor = editor

        this.active = panel.active
        this.visible = panel.visible

        this.subscriptions.push(
            panel.webview.onDidReceiveMessage(
                async (message: WebviewMessage) => {
                    switch (message.kind) {
                        case REQUEST_RELOAD_MESSAGE:
                            await this.reload()
                            break
                        case REQUEST_REVEAL_EDITOR_MESSAGE:
                            this.revealEditor(message.range)
                            break
                    }
                }
            ),
            panel.onDidChangeViewState(event => {
                if (event.webviewPanel.active !== this.active) {
                    this.manager.setActive(this, event.webviewPanel.active)
                }

                if (event.webviewPanel.visible !== this.visible) {
                    this.manager.setVisible(this, event.webviewPanel.visible)
                }
            }),
            panel.onDidDispose(() => {
                this.dispose()
            })
        )

        manager.store.add(this, document, editor)
        manager.setActive(this, panel.active)
        manager.setVisible(this, panel.visible)
    }

    override dispose(): void {
        this.manager.store.delete(this)
        this.manager.setActive(this, false)
        this.manager.setVisible(this, false)
        super.dispose()
    }

    /**
     * プレビューにエディターを関連づける
     *
     * @param editor
     */
    async attach(editor: vscode.TextEditor) {
        this.manager.store.setEditor(this, editor)
        await this.updateSelection(editor.selection)
        await this.updateVisibleRanges(editor.visibleRanges)
    }

    /**
     * プレビューからエディターとの関連づけを外す
     */
    async detach() {
        this.manager.store.deleteEditor(this)
        await this.updateSelection(undefined)
    }

    /**
     * プレビューを表示させる
     *
     * @param options
     */
    reveal(options?: vscode.ViewColumn) {
        this.panel.reveal(options)
    }

    /**
     * プレビューに関連づけられたエディターの指定範囲を表示させる
     *
     * @param range 表示させるエディターの範囲
     */
    revealEditor(range: TextRange) {
        const editor = this.editor

        if (!editor) {
            return
        }

        this.skipUpdateVisibleRanges = true

        editor.revealRange(
            new vscode.Range(
                range.start.line,
                range.start.character,
                range.end.line,
                range.end.character
            ),
            vscode.TextEditorRevealType.InCenterIfOutsideViewport
        )
    }

    /**
     * プレビューを再読み込みする
     */
    async reload(): Promise<void> {
        const { document, editor } = this

        const lines = []

        for (let i = 0, count = document.lineCount; i < count; i++) {
            lines.push(document.lineAt(i).text)
        }

        await this.post(
            ReloadMessage.create(
                { uri: document.uri.toString(), lines },
                editor === undefined
                    ? undefined
                    : {
                          selection: TextSelection.clone(editor.selection),
                          visibleRanges: editor.visibleRanges.map(
                              TextRange.clone
                          ),
                      },
                {
                    orientation: this.manager.configuration.layout.orientation,
                    style: this.createStyle(),
                }
            )
        )
    }

    /**
     * プレビューの内容を更新する
     *
     * @param changes `vscode.TextDocumentChangeEvent`から得られる変更情報
     */
    async updateContent(
        changes: readonly vscode.TextDocumentContentChangeEvent[]
    ) {
        await this.post(
            PatchMessage.create(
                changes.map(change => {
                    const { text, range } = change
                    const { start, end } = range

                    return {
                        text,
                        range: {
                            start: {
                                line: start.line,
                                character: start.character,
                            },
                            end: {
                                line: end.line,
                                character: end.character,
                            },
                        },
                    }
                })
            )
        )
    }

    /**
     * プレビューのURIを更新する
     *
     * @param uri 新しいURI
     */
    async updateUri(uri: vscode.Uri) {
        this.panel.title = Preview.createTitle(uri)
        await this.post(UriChangeMessage.create(uri.toString()))
    }

    /**
     * プレビューのレイアウト方向を更新する
     *
     * @param orientation レイアウト方向
     */
    async updateOrientation(orientation: Orientation) {
        await this.post(OrientationChangeMessage.create(orientation))
    }

    /**
     * プレビューのスタイルを更新する
     */
    async updateStyle() {
        const { styles, sheets } = this.createStyle()
        await this.post(StyleChangeMessage.create(styles, sheets))
    }

    /**
     * プレビューの選択範囲を更新する
     *
     * @param selection エディターの選択範囲
     */
    async updateSelection(selection: vscode.Selection | undefined) {
        await this.post(
            SelectionChangeMessage.create(
                selection ? TextSelection.clone(selection) : undefined
            )
        )
    }

    private skipUpdateVisibleRanges = false

    /**
     * プレビューの表示範囲を更新する
     *
     * @param visibleRanges エディターの表示範囲
     * @returns
     */
    async updateVisibleRanges(visibleRanges: readonly vscode.Range[]) {
        if (this.skipUpdateVisibleRanges) {
            this.skipUpdateVisibleRanges = false
            return
        }

        await this.post(
            VisibleRangesChangeMessage.create(
                visibleRanges.map(TextRange.clone)
            )
        )
    }

    /**
     * パネルにメッセージを送る
     *
     * @param message メッセージ
     */
    private async post(message: ExtensionMessage) {
        await this.panel.webview.postMessage(message)
    }

    /**
     * URIからプレビューパネルのタイトルを生成する
     *
     * @param uri プレビューするドキュメントのURI
     * @returns プレビューパネルのタイトル
     */
    private static createTitle(uri: vscode.Uri): string {
        return getLocalization().PREVIEW_TITLE_FORMAT(
            vscode.workspace.asRelativePath(uri)
        )
    }

    /**
     * Webviewのスタイルのためのデータを生成する
     * @returns スタイル
     */
    private createStyle(): PreviewStyle {
        const document = this.document
        const webview = this.panel.webview
        const context = this.manager.context
        const configuration = this.manager.configuration.style

        const styles: string[] = []
        const sheets: vscode.Uri[] = []

        const rules = []

        for (const [name, value] of [
            [PREVIEW_CSS_PROPERTY_NAME_FONT_FAMILY, configuration.fontFamily],
            [PREVIEW_CSS_PROPERTY_NAME_FONT_SIZE, configuration.fontSize],
            [PREVIEW_CSS_PROPERTY_NAME_LINE_HEIGHT, configuration.lineHeight],
        ]) {
            if (value) {
                rules.push(`${name}: ${value}`)
            }
        }

        if (rules.length) {
            styles.push(`:root{${rules.join(";")}}`)
        }

        let custom = false

        if (configuration.customStyleCSS) {
            custom = true
            styles.push(configuration.customStyleCSS)
        }

        if (configuration.customStyleSheets.length) {
            custom = true
            for (const string of configuration.customStyleSheets) {
                let uri: vscode.Uri

                try {
                    uri = parseUserUriAsWebviewUri(document, webview, string)
                } catch {
                    continue
                }

                sheets.push(uri)
            }
        }

        if (!custom || configuration.customStyleIncludeDefault) {
            sheets.unshift(
                webview.asWebviewUri(
                    context.getExtensionUri(PREVIEW_WEBVIEW_CSS_PATH)
                )
            )
        }

        return {
            styles,
            sheets: sheets.map(sheet => sheet.toString()),
        }
    }
}

/**
 * ユーザーから入力されたURI文字列をWebview用のURIとして解釈する
 *
 * @param document 現在のドキュメント
 * @param webview 変換の基準となるWebview
 * @param string URI文字列
 * @returns Webview用のURI
 */
function parseUserUriAsWebviewUri(
    document: vscode.TextDocument,
    webview: vscode.Webview,
    string: string
): vscode.Uri {
    if (string.startsWith("http:") || string.startsWith("https:")) {
        return vscode.Uri.parse(string)
    }

    if (string.startsWith("file:")) {
        return webview.asWebviewUri(vscode.Uri.parse(string))
    }

    if (string.startsWith("/")) {
        return webview.asWebviewUri(vscode.Uri.file(string))
    }

    const folder = vscode.workspace.getWorkspaceFolder(document.uri)

    if (folder) {
        return webview.asWebviewUri(vscode.Uri.joinPath(folder.uri, string))
    }

    return webview.asWebviewUri(vscode.Uri.joinPath(document.uri, string))
}
