import * as vscode from "vscode"
import {
    MARKDOWN_CONFIGURATION,
    MARKDOWN_CONFIGURATION_FIELD,
} from "../../base/consts"

export function isMarkdownEnabled(): boolean {
    return vscode.workspace
        .getConfiguration(MARKDOWN_CONFIGURATION)
        .get<boolean>(MARKDOWN_CONFIGURATION_FIELD.ENABLED, true)
}
