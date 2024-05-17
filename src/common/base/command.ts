import * as vscode from "vscode"

/**
 * コマンド
 */
export abstract class Command {
    /**
     * テキストエディターに対して呼ばれるコマンドである場合`true`
     */
    abstract readonly isTextEditor?: boolean
    /**
     * `package.json`で定義されているコマンドのID
     */
    abstract readonly id: string
    /**
     * コマンドを実行を定義する
     *
     * @param args コマンドへの引数
     */
    abstract execute(...args: unknown[]): Promise<void>
}

/**
 * URIに対して呼ばれるコマンド
 */
export abstract class UriCommand extends Command {
    readonly isTextEditor = false

    /**
     * URIに対するコマンドの実行を定義する
     *
     * @param uri
     */
    abstract executeUri(uri: vscode.Uri): Promise<void>

    async execute(uri: unknown): Promise<void> {
        if (uri instanceof vscode.Uri) {
            await this.executeUri(uri)
            return
        }

        const editor = vscode.window.activeTextEditor

        if (editor) {
            await this.executeUri(editor.document.uri)
        }
    }
}

/**
 * テキストエディターに対して呼ばれるコマンド
 */
export abstract class TextEditorCommand extends Command {
    readonly isTextEditor = true

    /**
     * コマンドが`TextEditorCommand`であるかどうかをチェックする
     *
     * @param command
     * @returns
     */
    static is(command: Command): command is TextEditorCommand {
        return command.isTextEditor === true
    }

    /**
     * テキストエディターへのコマンドの実行を定義する
     *
     * @param editor
     * @param edit
     */
    abstract executeTextEditor(
        editor: vscode.TextEditor,
        edit: vscode.TextEditorEdit,
    ): Promise<void>

    async execute(
        editor: vscode.TextEditor,
        edit: vscode.TextEditorEdit,
    ): Promise<void> {
        await this.executeTextEditor(editor, edit)
    }
}

/**
 * コマンドを管理する
 */
export class CommandManager implements vscode.Disposable {
    private readonly commands: Map<string, vscode.Disposable> = new Map()

    /**
     * コマンドを登録する
     *
     * @param command 登録するコマンド
     * @returns 登録するコマンド
     */
    register<T extends Command>(command: T): T {
        if (this.commands.has(command.id)) {
            return command
        }

        this.commands.set(
            command.id,
            TextEditorCommand.is(command)
                ? vscode.commands.registerTextEditorCommand(
                      command.id,
                      command.execute as (
                          editor: vscode.TextEditor,
                          edit: vscode.TextEditorEdit,
                      ) => void,
                      command,
                  )
                : vscode.commands.registerCommand(
                      command.id,
                      command.execute,
                      command,
                  ),
        )

        return command
    }

    dispose() {
        for (const disposable of this.commands.values()) {
            disposable.dispose()
        }

        this.commands.clear()
    }
}
