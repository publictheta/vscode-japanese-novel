import { Localization } from "./index"

/**
 * 日本語へのローカリゼーション
 */
export const JA: Localization = {
    LANG: "ja",
    COUNTER_FORMAT: (count: number) => `${count}文字`,
    PREVIEW_TITLE_PLACEHOLDER: "プレビュー",
    PREVIEW_TITLE_FORMAT: (path: string) => `プレビュー（${path}）`,
    PREVIEW_LOADING_MESSAGE: "プレビューを読み込み中…",
    NOTIFICATION: {
        infoCopyAsHTML:
            "テキストファイルをHTMLに変換してクリップボードにコピーしました。",
        infoCopyAsRubyOnly:
            "テキストファイルをルビのみに変換してクリップボードにコピーしました。",
        errorInvalidLanguageId: "ドキュメントの言語が不適切でした。",
        errorEditNotSingleLine: "行をまたいで適用することはできません。",
        errorEditContainSpecialCharacter:
            "特殊な文字を含む文字列に適用することはできません。",
        errorEditOther: "編集が適用できませんでした。",
        errorCopyClipboard: "クリップボードへのコピーに失敗しました。",
    },
    NOTIFICATION_OK: "OK",
    NOTIFICATION_SHOW_IN_STATUS_BAR: "ステータスバーに表示する",
    NOTIFICATION_DO_NOT_SHOW_AGAIN: "今後表示しない",
} as const
