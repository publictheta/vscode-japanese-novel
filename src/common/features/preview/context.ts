import * as vscode from "vscode"

/**
 * プレビューを表示する拡張機能のコンテクスト
 */
export class PreviewExtensionContext {
    extensionUri: vscode.Uri

    constructor(context: vscode.ExtensionContext) {
        this.extensionUri = context.extensionUri
    }

    /**
     * 拡張機能のリソースへのパスをURIに変換する
     *
     * @param pathSegments パスのセグメント
     * @returns 拡張機能のリソースへのURI
     */
    getExtensionUri(...pathSegments: string[]): vscode.Uri {
        return vscode.Uri.joinPath(this.extensionUri, ...pathSegments)
    }
}
