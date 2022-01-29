import * as vscode from "vscode"

import { CommandManager } from "./base/command"
import * as commands from "./commands"
import { PreviewManager } from "./features/preview"
import { CharacterCounter, CounterManager } from "./features/counter"

export function activate(context: vscode.ExtensionContext) {
    const counter = new CharacterCounter()
    context.subscriptions.push(counter)
    context.subscriptions.push(new CounterManager(counter))

    const preview = new PreviewManager(context)
    context.subscriptions.push(preview)

    const command = new CommandManager()
    command.register(new commands.InsertRubyCommand())
    command.register(new commands.InsertDotsCommand())
    command.register(new commands.CopyAsRubyOnlyCommand())
    command.register(new commands.CopyAsHTMLCommand())
    command.register(new commands.OpenPreviewCommand(preview))
    command.register(new commands.OpenPreviewToSideCommand(preview))
    command.register(new commands.OpenPreviewSource(preview))
    command.register(new commands.FormatWithIndentationCommand())
    command.register(new commands.FormatWithoutIndentationCommand())
    context.subscriptions.push(command)
}

export function deactivate() {
    // noop
}
