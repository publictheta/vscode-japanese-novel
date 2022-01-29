import * as vscode from "vscode"

import * as extension from "../common/extension"

export function activate(context: vscode.ExtensionContext) {
    extension.activate(context)
}

export function deactivate() {
    extension.deactivate()
}
