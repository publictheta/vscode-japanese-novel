import * as vscode from "vscode"

/**
 * 特定のロケールへのローカリゼーションを定義する
 */
export type Localization = Readonly<{
    LANG: string
    COUNTER_FORMAT: (count: number) => string
    PREVIEW_TITLE_PLACEHOLDER: string
    PREVIEW_TITLE_FORMAT: (path: string) => string
    PREVIEW_LOADING_MESSAGE: string
    NOTIFICATION: Readonly<Record<NotificationId, string>>
    NOTIFICATION_OK: string
    NOTIFICATION_SHOW_IN_STATUS_BAR: string
    NOTIFICATION_DO_NOT_SHOW_AGAIN: string
}>

import { JA } from "./ja"
import { EN } from "./en"
import { NotificationId } from "../base/consts"

/**
 * ローカリゼーションを取得する
 *
 * @param locale ロケールのID。指定されない場合はデフォルトのロケールが使用される。
 * @returns
 */
export function getLocalization(locale?: "ja" | "en"): Localization {
    const language = locale || vscode.env.language

    switch (language.slice(0, 2)) {
        case "ja":
            return JA
        case "en":
            return EN
        default:
            return JA
    }
}
