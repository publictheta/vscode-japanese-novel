export type ConstEnum<T> = T[keyof T]

export const EXTENSION_ID = "japanese-novel" as const

// MARK: Language

export const EXTENSION_LANGUAGE_ID = "japanese-novel" as const

// MARK: Command

export const COMMAND_INSERT_RUBY = `${EXTENSION_ID}.insertRuby` as const
export const COMMAND_INSERT_DOTS = `${EXTENSION_ID}.insertDots` as const
export const COMMAND_OPEN_PREVIEW = `${EXTENSION_ID}.openPreview` as const
export const COMMAND_OPEN_PREVIEW_TO_SIDE =
    `${EXTENSION_ID}.openPreviewToSide` as const
export const COMMAND_OPEN_PREVIEW_SOURCE =
    `${EXTENSION_ID}.openPreviewSource` as const
export const COMMAND_COPY_AS_HTML = `${EXTENSION_ID}.copyAsHTML` as const
export const COMMAND_COPY_AS_RUBY_ONLY =
    `${EXTENSION_ID}.copyAsRubyOnly` as const
export const COMMAND_FORMAT_WITH_INDENTATION =
    `${EXTENSION_ID}.formatWithIndentation` as const
export const COMMAND_FORMAT_WITHOUT_INDENTATION =
    `${EXTENSION_ID}.formatWithoutIndentation` as const

// MARK: Preview

export const PREVIEW_VIEW_TYPE = "japanese-novel.preview" as const

export const PREVIEW_WEBVIEW_CSS_PATH = "dist/webviews/preview.css" as const
export const PREVIEW_WEBVIEW_JS_PATH = "dist/webviews/preview.js" as const

export type PreviewContextKey = ConstEnum<typeof PREVIEW_CONTEXT_KEY>
export const PREVIEW_CONTEXT_KEY = {
    HAS_ACTIVE: `${EXTENSION_ID}.preview.hasActive`,
    ACTIVE_PATH: `${EXTENSION_ID}.preview.activePath`,
    VISIBLE_PATHS: `${EXTENSION_ID}.preview.visiblePaths`,
} as const

export const PREVIEW_CONFIGURATION = `${EXTENSION_ID}.preview` as const
export const PREVIEW_CONFIGURATION_SECTION = {
    LAYOUT: `${PREVIEW_CONFIGURATION}.layout`,
    STYLE: `${PREVIEW_CONFIGURATION}.style`,
    STYLE_CUSTOM: `${PREVIEW_CONFIGURATION}.style.custom`,
} as const
export const PREVIEW_CONFIGURATION_FIELD = {
    ORIENTATION: "layout.orientation",
    FONT_FAMILY: "style.fontFamily",
    FONT_SIZE: "style.fontSize",
    LINE_HEIGHT: "style.lineHeight",
    CUSTOM_CSS: "style.custom.css",
    CUSTOM_SHEETS: "style.custom.sheets",
    CUSTOM_INCLUDE_DEFAULT: "style.custom.includeDefault",
} as const

export const PREVIEW_CSS_CLASS_NAME_CONTAINER = "preview-container" as const
export const PREVIEW_CSS_CLASS_NAME_SELECTED = "preview-selected" as const
export const PREVIEW_CSS_CLASS_NAME_HORIZONTAL = "preview-horizontal" as const
export const PREVIEW_CSS_CLASS_NAME_VERTICAL = "preview-vertical" as const
export const PREVIEW_CSS_PROPERTY_NAME_FONT_FAMILY =
    "--preview-font-family" as const
export const PREVIEW_CSS_PROPERTY_NAME_FONT_SIZE =
    "--preview-font-size" as const
export const PREVIEW_CSS_PROPERTY_NAME_LINE_HEIGHT =
    "--preview-line-height" as const

export type Orientation = ConstEnum<typeof ORIENTATION>
export const ORIENTATION = {
    HORIZONTAL: "horizontal",
    VERTICAL: "vertical",
} as const

// MARK: Notification

export const NOTIFICATION_CONFIGURATION =
    `${EXTENSION_ID}.notification` as const
export const NOTIFICATION_CONFIGURATION_SECTION = {
    DISPLAY: `${NOTIFICATION_CONFIGURATION}.display`,
} as const

export type NotificationId = InfoNotificationId | ErrorNotificationId
export type InfoNotificationId = ConstEnum<typeof NOTIFICATION_ID.INFO>
export type ErrorNotificationId = ConstEnum<typeof NOTIFICATION_ID.ERROR>
export const NOTIFICATION_ID = {
    INFO: {
        COPY_AS_HTML: "infoCopyAsHTML",
        COPY_AS_RUBY_ONLY: "infoCopyAsRubyOnly",
    },
    ERROR: {
        INVALID_LANGUAGE_ID: "errorInvalidLanguageId",
        EDIT_NOT_SINGLE_LINE: "errorEditNotSingleLine",
        EDIT_CONTAIN_SPECIAL_CHARACTER: "errorEditContainSpecialCharacter",
        EDIT_OTHER: "errorEditOther",
        COPY_CLIPBOARD: "errorCopyClipboard",
    },
} as const

export type NotificationDisplay = ConstEnum<typeof NOTIFICATION_DISPLAY>
export const NOTIFICATION_DISPLAY = {
    SHOW: "show",
    STATUS_BAR: "statusBar",
    NONE: "none",
} as const
