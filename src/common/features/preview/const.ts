import { EXTENSION_ID } from "../../const"

export const PREVIEW_VIEW_TYPE = `${EXTENSION_ID}.preview`

export const PREVIEW_WEBVIEW_CSS_PATH = "dist/webviews/preview.css"
export const PREVIEW_WEBVIEW_JS_PATH = "dist/webviews/preview.js"

export const PREVIEW_CSS_CLASS_NAME_CONTAINER = "preview-container"
export const PREVIEW_CSS_CLASS_NAME_SELECTED = "preview-selected"
export const PREVIEW_CSS_CLASS_NAME_HORIZONTAL = "preview-horizontal"
export const PREVIEW_CSS_CLASS_NAME_VERTICAL = "preview-vertical"
export const PREVIEW_CSS_PROPERTY_NAME_FONT_FAMILY = "--preview-font-family"
export const PREVIEW_CSS_PROPERTY_NAME_FONT_SIZE = "--preview-font-size"
export const PREVIEW_CSS_PROPERTY_NAME_LINE_HEIGHT = "--preview-line-height"
export const PREVIEW_CSS_PROPERTY_NAME_MAX_WIDTH = "--preview-max-width"

export const enum Orientation {
    HORIZONTAL = "horizontal",
    VERTICAL = "vertical",
}

/**
 * プレビューが永続化する状態
 */
export type PreviewState = {
    uri: string
}

/**
 * プレビューのWebviewに挿入するスタイル
 */
export type PreviewStyle = {
    /**
     * CSSのテキスト
     */
    styles: string[]
    /**
     * CSSのURI
     */
    sheets: string[]
}
