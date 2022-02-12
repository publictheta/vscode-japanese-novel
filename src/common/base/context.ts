import * as vscode from "vscode"

import { ContextKey } from "./consts"

const SET_CONTEXT = "setContext" as const

export function setContext(key: ContextKey, value: unknown) {
    void vscode.commands.executeCommand(SET_CONTEXT, key, value)
}
