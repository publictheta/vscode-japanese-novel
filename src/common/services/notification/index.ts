import * as vscode from "vscode"

import {
    ConstEnum,
    ErrorNotificationId,
    InfoNotificationId,
    NotificationDisplay,
    NotificationId,
    NOTIFICATION_DISPLAY,
    NOTIFICATION_CONFIGURATION_SECTION,
} from "../../base/consts"
import { getLocalization } from "../../i18n"

/**
 * 通知のレベル
 */
type NotificationLevel = ConstEnum<typeof NOTIFICATION_LEVEL>
const NOTIFICATION_LEVEL = {
    ERROR: "error",
    INFORMATION: "information",
} as const

const OK = "ok" as const
const SHOW_IN_STATUS_BAR = "showInStatusBar" as const
const DO_NOT_SHOW_AGAIN = "doNotShowAgain" as const

/**
 * 通知機能を提供する
 */
export class NotificationService {
    /**
     * `Error`を作成する
     *
     * @param id 通知メッセージのID
     * @returns エラー
     */
    static createError(id: ErrorNotificationId): Error {
        return new Error(`${id}: ${getLocalization().NOTIFICATION[id]}`)
    }

    /**
     * 情報メッセージを表示する
     *
     * @param id 通知メッセージのID
     */
    static async showInformationMessage(id: InfoNotificationId): Promise<void> {
        await NotificationService.showMessage(
            id,
            NOTIFICATION_LEVEL.INFORMATION
        )
    }

    /**
     * エラーメッセージを表示する
     *
     * @param id 通知メッセージのID
     */
    static async showErrorMessage(id: ErrorNotificationId): Promise<void> {
        await NotificationService.showMessage(id, NOTIFICATION_LEVEL.ERROR)
    }

    /**
     * メッセージを実際に表示する
     *
     * @param id 通知メッセージのID
     * @param level 通知のレベル
     * @returns
     */
    private static async showMessage(
        id: NotificationId,
        level: NotificationLevel
    ): Promise<void> {
        const configuration = vscode.workspace.getConfiguration(
            NOTIFICATION_CONFIGURATION_SECTION.DISPLAY
        )

        const display = configuration.get<NotificationDisplay>(id)

        if (display === NOTIFICATION_DISPLAY.NONE) {
            return
        }

        const localization = getLocalization()
        const message = localization.NOTIFICATION[id]

        if (display === NOTIFICATION_DISPLAY.STATUS_BAR) {
            vscode.window.setStatusBarMessage(message, 3000)
            return
        }

        const items = [
            {
                id: OK,
                title: localization.NOTIFICATION_OK,
            },
            {
                id: SHOW_IN_STATUS_BAR,
                title: localization.NOTIFICATION_SHOW_IN_STATUS_BAR,
            },
            {
                id: DO_NOT_SHOW_AGAIN,
                title: localization.NOTIFICATION_DO_NOT_SHOW_AGAIN,
            },
        ]

        let item = undefined

        switch (level) {
            case NOTIFICATION_LEVEL.INFORMATION:
                item = await vscode.window.showInformationMessage(
                    message,
                    ...items
                )
                break
            case NOTIFICATION_LEVEL.ERROR:
                item = await vscode.window.showErrorMessage(message, ...items)
                break
        }

        if (!item) {
            return
        }

        switch (item.id) {
            case OK:
                break
            case SHOW_IN_STATUS_BAR:
                await configuration.update(id, NOTIFICATION_DISPLAY.STATUS_BAR)
                break
            case DO_NOT_SHOW_AGAIN:
                await configuration.update(id, NOTIFICATION_DISPLAY.NONE)
                break
        }
    }
}
