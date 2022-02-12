import * as vscode from "vscode"
import type MarkdownIt from "markdown-it"

import {
    MARKDOWN_CONFIGURATION_ENABLED,
    MARKDOWN_CONTEXT_KEY,
} from "../../base/consts"
import { Disposable } from "../../base/dispose"
import { isMarkdownEnabled } from "./configuration"
import MarkdownItJapaneseNovel from "./plugin"
import { setContext } from "../../base/context"

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
                if (!e.affectsConfiguration(MARKDOWN_CONFIGURATION_ENABLED)) {
                    return
                }

                setContext(MARKDOWN_CONTEXT_KEY.ENABLED, isMarkdownEnabled())

                void vscode.commands.executeCommand(
                    "markdown.api.reloadPlugins"
                )
            })
        )

        setContext(MARKDOWN_CONTEXT_KEY.ENABLED, isMarkdownEnabled())
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
