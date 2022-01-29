import * as vscode from "vscode"

import { EXTENSION_LANGUAGE_ID } from "../../base/consts"
import { Disposable } from "../../base/dispose"
import { merge, Patch } from "../../base/merge"
import { toPlain } from "../../base/string"
import { getLocalization } from "../../i18n"

export interface Counter {
    count(text: string): number
}

export class CharacterCounter implements Counter, vscode.Disposable {
    count(text: string): number {
        text = toPlain(text).replace(/\s+/, "")
        return [...text].length
    }

    dispose() {
        // noop
    }
}

export type CounterLine = {
    text: string
    data: number
}

export class CounterState implements vscode.Disposable {
    private count: number
    private lines: CounterLine[]

    constructor(count: number, lines: CounterLine[]) {
        this.count = count
        this.lines = lines
    }

    static create(
        counter: Counter,
        document: vscode.TextDocument
    ): CounterState {
        let count = 0

        const lines: CounterLine[] = []

        for (let i = 0, len = document.lineCount; i < len; i++) {
            const text = document.lineAt(i).text
            const data = counter.count(text)
            count += data
            lines.push({ text, data })
        }

        return new CounterState(count, lines)
    }

    current(): number {
        return this.count
    }

    currentInRange(counter: Counter, range: Readonly<vscode.Range>): number {
        if (range.isSingleLine) {
            const line = this.lines[range.start.line]
            const text = line.text.slice(
                range.start.character,
                range.end.character
            )
            return counter.count(text)
        }

        let count = 0

        count += counter.count(
            this.lines[range.start.line].text.slice(range.start.character)
        )

        for (let i = range.start.line + 1, end = range.end.line; i < end; i++) {
            count += this.lines[i].data
        }

        count += counter.count(
            this.lines[range.end.line].text.slice(0, range.end.character)
        )

        return count
    }

    update(counter: Counter, patches: Readonly<Patch[]>) {
        let count = this.count

        merge(this.lines, patches, {
            create(newText) {
                const newData = counter.count(newText)
                count += newData
                return newData
            },
            update(newText, oldData) {
                count -= oldData
                const newData = counter.count(newText)
                count += newData
                return newData
            },
            remove(oldData) {
                count -= oldData
            },
        })

        this.count = count
    }

    dispose(): void {
        this.lines = []
        this.count = 0
    }
}

/**
 * カウンターを管理するクラス
 */
export class CounterManager extends Disposable implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem | null = null
    private states: Map<vscode.TextDocument, CounterState> = new Map()

    constructor(private readonly counter: Counter) {
        super()

        this.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(event => {
                const state = this.states.get(event.document)

                if (!state) {
                    return
                }

                state.update(counter, event.contentChanges)
            }),
            vscode.workspace.onDidCloseTextDocument(document => {
                const state = this.states.get(document)

                if (!state) {
                    return
                }

                state.dispose()
                this.states.delete(document)
            }),
            vscode.window.onDidChangeActiveTextEditor(editor => {
                this.toggle(editor)
            }),
            vscode.window.onDidChangeTextEditorSelection(event => {
                if (
                    event.textEditor.document.languageId !==
                    EXTENSION_LANGUAGE_ID
                ) {
                    return
                }

                this.showSelection(event.textEditor.document, event.selections)
            })
        )

        this.toggle(vscode.window.activeTextEditor)
    }

    toggle(editor: vscode.TextEditor | undefined) {
        if (editor && editor.document.languageId === EXTENSION_LANGUAGE_ID) {
            this.showDocument(editor.document)
        } else {
            this.hide()
        }
    }

    getOrCreateItem(): vscode.StatusBarItem {
        let item = this.statusBarItem

        if (item) {
            return item
        }

        item = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            0
        )
        this.statusBarItem = item
        return item
    }

    getOrCreateState(document: vscode.TextDocument): CounterState {
        let state = this.states.get(document)

        if (state) {
            return state
        }

        state = CounterState.create(this.counter, document)
        this.states.set(document, state)
        return state
    }

    hide(): void {
        if (this.statusBarItem === null) {
            return
        }

        this.statusBarItem.hide()
    }

    showDocument(document: vscode.TextDocument): void {
        const state = this.getOrCreateState(document)
        const count = state.current()
        const item = this.getOrCreateItem()

        item.text = getLocalization().COUNTER_FORMAT(count)
        item.show()
    }

    showSelection(
        document: vscode.TextDocument,
        selections: readonly vscode.Selection[]
    ): void {
        if (selections.length <= 0) {
            this.showDocument(document)
            return
        }

        const selection = selections[0]

        if (selection.isEmpty) {
            this.showDocument(document)
            return
        }

        const state = this.getOrCreateState(document)
        const count = state.currentInRange(this.counter, selection)
        const item = this.getOrCreateItem()

        item.text = getLocalization().COUNTER_FORMAT(count)
        item.show()
    }

    override dispose() {
        if (this.statusBarItem) {
            this.statusBarItem.dispose()
        }

        for (const state of this.states.values()) {
            state.dispose()
        }

        super.dispose()
    }
}
