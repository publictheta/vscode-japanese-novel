import * as vscode from "vscode"

import assert from "assert"

suite("拡張機能テストスイート（Web）", () => {
    void vscode.window.showInformationMessage("拡張機能のテストを開始します。")

    test("HTMLに変換してコピー", async () => {
        const document = await vscode.workspace.openTextDocument({
            language: "japanese-novel",
            content: [
                "｜テキスト《ルビ》",
                "漢字《かんじ》",
                "《《傍点》》",
                "",
            ].join("\n"),
        })

        await vscode.window.showTextDocument(document, vscode.ViewColumn.Active)

        await vscode.commands.executeCommand("japanese-novel.copyAsHTML")

        assert.equal(
            await vscode.env.clipboard.readText(),
            [
                "<p><ruby>テキスト<rt>ルビ</rt></ruby></p>",
                "<p><ruby>漢字<rt>かんじ</rt></ruby></p>",
                "<p><em><span>傍</span><span>点</span></em></p>",
                "<p><br></p>",
            ].join("")
        )

        await vscode.commands.executeCommand(
            "workbench.action.closeActiveEditor"
        )
    })
})
