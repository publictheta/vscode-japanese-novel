import * as vscode from "vscode"
import { EXTENSION_ID } from "../../const"

export const enum InfoNotificationId {
    CopyAsHTML = "infoCopyAsHTML",
    CopyAsRubyOnly = "infoCopyAsRubyOnly",
}

export const enum ErrorNotificationId {
    InvalidLanguageId = "errorInvalidLanguageId",
    EditNotSingleLine = "errorEditNotSingleLine",
    EditContainSpecialCharacter = "errorEditContainSpecialCharacter",
    EditOther = "errorEditOther",
    CopyClipboard = "errorCopyClipboard",
}

export type NotificationId = InfoNotificationId | ErrorNotificationId

export const NOTIFICATION_CONFIGURATION = `${EXTENSION_ID}.notification`
export const NOTIFICATION_CONFIGURATION_SECTION = {
    DISPLAY: `${NOTIFICATION_CONFIGURATION}.display`,
} as const

export const enum NotificationDisplay {
    Show = "show",
    StatusBar = "statusBar",
    None = "none",
}

/**
 * 通知のレベル
 */
const enum NotificationLevel {
    Error = "error",
    Info = "info",
}

/**
 * 通知の選択項目のID。
 */
const enum ItemId {
    Ok = "ok",
    ShowInStatusBar = "showInStatusBar",
    DoNotShowAgain = "doNotShowAgain",
}

function getMessage(id: NotificationId): string {
    switch (id) {
        case InfoNotificationId.CopyAsHTML:
            return vscode.l10n.t(
                "Successfully converted the text file to ruby only and copied it to the clipboard.",
            )
        case InfoNotificationId.CopyAsRubyOnly:
            return vscode.l10n.t(
                "Successfully converted the text file to HTML and copied it to the clipboard.",
            )
        case ErrorNotificationId.InvalidLanguageId:
            return vscode.l10n.t("The document language was invalid.")
        case ErrorNotificationId.EditNotSingleLine:
            return vscode.l10n.t("Cannot apply the edit across lines.")
        case ErrorNotificationId.EditContainSpecialCharacter:
            return vscode.l10n.t(
                "Cannot apply the edit to the text that contains special characters.",
            )
        case ErrorNotificationId.EditOther:
            return vscode.l10n.t("Failed to apply the edit.")
        case ErrorNotificationId.CopyClipboard:
            return vscode.l10n.t("Failed to copy to the clipboard.")
    }
}

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
        return new Error(`${id}: ${getMessage(id)}`)
    }

    /**
     * 情報メッセージを表示する
     *
     * @param id 通知メッセージのID
     */
    static async showInformationMessage(id: InfoNotificationId): Promise<void> {
        await NotificationService.showMessage(id, NotificationLevel.Info)
    }

    /**
     * エラーメッセージを表示する
     *
     * @param id 通知メッセージのID
     */
    static async showErrorMessage(id: ErrorNotificationId): Promise<void> {
        await NotificationService.showMessage(id, NotificationLevel.Error)
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
        level: NotificationLevel,
    ): Promise<void> {
        const configuration = vscode.workspace.getConfiguration(
            NOTIFICATION_CONFIGURATION_SECTION.DISPLAY,
        )

        const display = configuration.get<NotificationDisplay>(id)

        if (display === NotificationDisplay.None) {
            return
        }

        const message = getMessage(id)

        if (display === NotificationDisplay.StatusBar) {
            vscode.window.setStatusBarMessage(message, 3000)
            return
        }

        const items = [
            {
                id: ItemId.Ok,
                title: vscode.l10n.t("OK"),
            },
            {
                id: ItemId.ShowInStatusBar,
                title: vscode.l10n.t("Show in the status bar."),
            },
            {
                id: ItemId.DoNotShowAgain,
                title: vscode.l10n.t("Don't show again."),
            },
        ]

        let item = undefined

        switch (level) {
            case NotificationLevel.Info:
                item = await vscode.window.showInformationMessage(
                    message,
                    ...items,
                )
                break
            case NotificationLevel.Error:
                item = await vscode.window.showErrorMessage(message, ...items)
                break
        }

        if (!item) {
            return
        }

        switch (item.id) {
            case ItemId.Ok:
                break
            case ItemId.ShowInStatusBar:
                await configuration.update(id, NotificationDisplay.StatusBar)
                break
            case ItemId.DoNotShowAgain:
                await configuration.update(id, NotificationDisplay.None)
                break
        }
    }
}
