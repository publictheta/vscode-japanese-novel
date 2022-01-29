import { Localization } from "./index"

/**
 * 英語へのローカリゼーション
 */
export const EN: Localization = {
    LANG: "en",
    COUNTER_FORMAT: (count: number) =>
        count > 1 ? `${count} chars` : `${count} char`,
    PREVIEW_TITLE_PLACEHOLDER: "Preview",
    PREVIEW_TITLE_FORMAT: (path: string) => `Preview ${path}`,
    PREVIEW_LOADING_MESSAGE: "Loading preview...",
    NOTIFICATION: {
        infoCopyAsHTML:
            "Successfully converted the text file to ruby only and copied it to the clipboard.",
        infoCopyAsRubyOnly:
            "Successfully converted the text file to HTML and copied it to the clipboard.",
        errorInvalidLanguageId: "The document language was invalid.",
        errorEditNotSingleLine: "Cannot apply the edit across lines.",
        errorEditContainSpecialCharacter:
            "Cannot apply the edit to the text that contains special characters.",
        errorEditOther: "Failed to apply the edit.",
        errorCopyClipboard: "Failed to copy to the clipboard.",
    },
    NOTIFICATION_OK: "OK",
    NOTIFICATION_SHOW_IN_STATUS_BAR: "Show in the status bar.",
    NOTIFICATION_DO_NOT_SHOW_AGAIN: "Don't show again.",
} as const
