import * as vscode from "vscode"

import * as extension from "../common/extension"

export function activate(context: vscode.ExtensionContext) {
    return extension.activate(context)
}

export function deactivate() {
    return extension.deactivate()
}
