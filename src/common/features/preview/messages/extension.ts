import { Orientation } from "../../../base/consts"
import { Patch } from "../../../base/merge"
import { TextRange, TextSelection } from "../../../base/position"
import { PreviewStyle } from "../../../features/preview"

/**
 * 拡張機能からWebviewへと送られるメッセージ
 */
export type ExtensionMessage =
    | UriChangeMessage
    | OrientationChangeMessage
    | StyleChangeMessage
    | ReloadMessage
    | PatchMessage
    | SelectionChangeMessage
    | VisibleRangesChangeMessage

export const URI_CHANGE_MESSAGE = "uriChange" as const
export const ORIENTATION_CHANGE_MESSAGE = "orientationChange" as const
export const STYLE_CHANGE_MESSAGE = "styleChange" as const
export const RELOAD_MESSAGE = "reload" as const
export const PATCH_MESSAGE = "patch" as const
export const SELECTION_CHANGE_MESSAGE = "selectionChange" as const
export const VISIBLE_RANGES_CHANGE_MESSAGE = "visibleRangesChange" as const

/**
 * URIの変更を伝えるメッセージ
 */
export type UriChangeMessage = {
    kind: typeof URI_CHANGE_MESSAGE
    uri: string
}

export namespace UriChangeMessage {
    /**
     * `UriChangeMessage`を作成する
     *
     * @param uri
     * @returns メッセージ
     */
    export function create(uri: string): UriChangeMessage {
        return {
            kind: URI_CHANGE_MESSAGE,
            uri,
        }
    }
}

/**
 * レイアウト方向の変更を伝えるメッセージ
 */
export type OrientationChangeMessage = {
    kind: typeof ORIENTATION_CHANGE_MESSAGE
    orientation: Orientation
}

export namespace OrientationChangeMessage {
    /**
     * `OrientationChangeMessage`を作成する
     *
     * @param orientation
     * @returns メッセージ
     */
    export function create(orientation: Orientation): OrientationChangeMessage {
        return {
            kind: ORIENTATION_CHANGE_MESSAGE,
            orientation,
        }
    }
}

/**
 * スタイルの変更を伝えるメッセージ
 */
export type StyleChangeMessage = {
    kind: typeof STYLE_CHANGE_MESSAGE
    styles: string[]
    sheets: string[]
}

export namespace StyleChangeMessage {
    /**
     * `StyleChangeMessage`を作成する
     *
     * @param styles
     * @param sheets
     * @returns メッセージ
     */
    export function create(
        styles: string[],
        sheets: string[]
    ): StyleChangeMessage {
        return {
            kind: STYLE_CHANGE_MESSAGE,
            styles,
            sheets,
        }
    }
}

/**
 * リロードを指示するメッセージ
 */
export type ReloadMessage = {
    kind: typeof RELOAD_MESSAGE
    document: {
        uri: string
        lines: string[]
    }
    editor?: {
        selection: TextSelection
        visibleRanges: TextRange[]
    }
    configuration: {
        orientation: Orientation
        style: PreviewStyle
    }
}

export namespace ReloadMessage {
    /**
     * `RelaodMessage`を作成する
     *
     * @param lines
     * @returns メッセージ
     */
    export function create(
        document: { uri: string; lines: string[] },
        editor:
            | { selection: TextSelection; visibleRanges: TextRange[] }
            | undefined,
        configuration: {
            orientation: Orientation
            style: PreviewStyle
        }
    ): ReloadMessage {
        return {
            kind: RELOAD_MESSAGE,
            document,
            editor,
            configuration,
        }
    }
}

/**
 * パッチの適用を指示するメッセージ
 */
export type PatchMessage = {
    kind: typeof PATCH_MESSAGE
    patches: Patch[]
}

export namespace PatchMessage {
    /**
     * `PatchMessage`を作成する
     *
     * @param patches
     * @returns メッセージ
     */
    export function create(patches: Patch[]): PatchMessage {
        return { kind: PATCH_MESSAGE, patches }
    }
}

/**
 * 選択範囲の変更を伝えるメッセージ
 */
export type SelectionChangeMessage = {
    kind: typeof SELECTION_CHANGE_MESSAGE
    selection?: TextSelection
}

export namespace SelectionChangeMessage {
    /**
     * `SelectionChangeMessage`を作成する
     *
     * @param selection
     * @returns メッセージ
     */
    export function create(
        selection: TextSelection | undefined
    ): SelectionChangeMessage {
        return {
            kind: SELECTION_CHANGE_MESSAGE,
            selection,
        }
    }
}

/**
 * 表示範囲の変更を伝えるメッセージ
 */
export type VisibleRangesChangeMessage = {
    kind: typeof VISIBLE_RANGES_CHANGE_MESSAGE
    visibleRanges: TextRange[]
}

export namespace VisibleRangesChangeMessage {
    /**
     * `VisibleRangesChangeMessage`を作成する
     *
     * @param selection
     * @param visibleRanges
     * @returns メッセージ
     */
    export function create(
        visibleRanges: TextRange[]
    ): VisibleRangesChangeMessage {
        return {
            kind: VISIBLE_RANGES_CHANGE_MESSAGE,
            visibleRanges,
        }
    }
}
