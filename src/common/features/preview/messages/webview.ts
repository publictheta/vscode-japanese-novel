import { TextRange } from "../../../base/position"

/**
 * Webviewから拡張機能へと送られるメッセージ
 */
export type WebviewMessage = RequestReloadMessage | RequestRevealEditorMessage

export const REQUEST_RELOAD_MESSAGE = "requestReload" as const
export const REQUEST_REVEAL_EDITOR_MESSAGE = "requestRevealEditor" as const

/**
 * リロードをリクエストするメッセージ
 */
export type RequestReloadMessage = {
    kind: typeof REQUEST_RELOAD_MESSAGE
}

export namespace RequestReloadMessage {
    /**
     * `RequestReloadMessage`を作成する
     *
     * @returns メッセージ
     */
    export function create(): RequestReloadMessage {
        return { kind: REQUEST_RELOAD_MESSAGE }
    }
}

/**
 * リロードをリクエストするメッセージ
 */
export type RequestRevealEditorMessage = {
    kind: typeof REQUEST_REVEAL_EDITOR_MESSAGE
    range: TextRange
}

export namespace RequestRevealEditorMessage {
    /**
     * `RequestRevealEditorMessage`を作成する
     *
     * @returns メッセージ
     */
    export function create(range: TextRange): RequestRevealEditorMessage {
        return { kind: REQUEST_REVEAL_EDITOR_MESSAGE, range }
    }
}
