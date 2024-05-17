import * as vscode from "vscode"
import type MarkdownIt from "markdown-it"

import { Disposable } from "../../base/dispose"
import { MarkdownContextKey, setContext } from "../../base/context"
import MarkdownItJapaneseNovel from "./plugin"

export interface IMarkdownItPlugin {
    extendMarkdownIt(md: MarkdownIt): MarkdownIt
}

export class MarkdownItPluginManager
    extends Disposable
    implements vscode.Disposable
{
    constructor() {
        super()

        this.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (!affectsMarkdownEnabled(e)) {
                    return
                }

                setContext(MarkdownContextKey.Enabled, isMarkdownEnabled())

                void vscode.commands.executeCommand(
                    "markdown.api.reloadPlugins",
                )
            }),
        )

        setContext(MarkdownContextKey.Enabled, isMarkdownEnabled())
    }

    getMarkdownItPlugin(): IMarkdownItPlugin {
        return {
            extendMarkdownIt(md: MarkdownIt) {
                if (!isMarkdownEnabled()) {
                    return md
                }

                return md.use(MarkdownItJapaneseNovel, { globalGroup: true })
            },
        }
    }
}

function affectsMarkdownEnabled(e: vscode.ConfigurationChangeEvent): boolean {
    return e.affectsConfiguration("markdown.japanese-novel.enabled")
}

function isMarkdownEnabled(): boolean {
    return vscode.workspace
        .getConfiguration("markdown.japanese-novel")
        .get<boolean>("enabled", true)
}
