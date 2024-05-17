import * as vscode from "vscode"
import { EXTENSION_ID } from "../const"

const SET_CONTEXT = "setContext"

export function setContext(key: ContextKey, value: unknown) {
    void vscode.commands.executeCommand(SET_CONTEXT, key, value)
}

export type ContextKey = PreviewContextKey | MarkdownContextKey

export const enum PreviewContextKey {
    HasActive = `${EXTENSION_ID}.preview.hasActive`,
    ActivePath = `${EXTENSION_ID}.preview.activePath`,
    VisiblePaths = `${EXTENSION_ID}.preview.visiblePaths`,
}

export const enum MarkdownContextKey {
    Enabled = `${EXTENSION_ID}.markdown.enabled`,
}
