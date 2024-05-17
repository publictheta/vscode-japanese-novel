import * as vscode from "vscode"

import { equalsRecord } from "../../base/collections"
import { EXTENSION_ID } from "../../const"
import { Orientation } from "./const"

export const PREVIEW_CONFIGURATION = `${EXTENSION_ID}.preview`

export const enum PreviewConfigurationSection {
    LAYOUT = `${PREVIEW_CONFIGURATION}.layout`,
    STYLE = `${PREVIEW_CONFIGURATION}.style`,
}

export const enum PreviewConfigurationField {
    ORIENTATION = "layout.orientation",
    FONT_FAMILY = "style.fontFamily",
    FONT_SIZE = "style.fontSize",
    LINE_HEIGHT = "style.lineHeight",
    MAX_WIDTH = "style.maxWidth",
    CUSTOM_CSS = "style.custom.css",
    CUSTOM_SHEETS = "style.custom.sheets",
    CUSTOM_INCLUDE_DEFAULT = "style.custom.includeDefault",
}

/**
 * プレビューの設定
 */
export class PreviewConfiguration {
    layout: PreviewLayoutConfiguration
    style: PreviewStyleConfiguration

    constructor(options?: {
        layout?: PreviewLayoutConfiguration
        style?: PreviewStyleConfiguration
    }) {
        const configuration = vscode.workspace.getConfiguration(
            PREVIEW_CONFIGURATION,
        )

        this.layout =
            options?.layout || new PreviewLayoutConfiguration(configuration)
        this.style =
            options?.style || new PreviewStyleConfiguration(configuration)
    }
}

/**
 * プレビューのレイアウト設定
 */
export class PreviewLayoutConfiguration {
    readonly orientation: Orientation

    constructor(configuration: vscode.WorkspaceConfiguration) {
        this.orientation = configuration.get<Orientation>(
            PreviewConfigurationField.ORIENTATION,
            Orientation.HORIZONTAL,
        )
    }

    /**
     * プレビューのレイアウト設定が等しいかどうかを比較する
     *
     * @param other プレビューのレイアウト設定
     * @returns 等しい場合`true`
     */
    equals(other: this): boolean {
        return equalsRecord(this, other)
    }
}

/**
 * プレビューのスタイル設定
 */
export class PreviewStyleConfiguration {
    readonly fontFamily: string
    readonly fontSize: string
    readonly lineHeight: number
    readonly maxWidth: string
    readonly customStyleCSS: string
    readonly customStyleSheets: string[]
    readonly customStyleIncludeDefault: boolean

    constructor(configuration: vscode.WorkspaceConfiguration) {
        this.fontFamily = configuration
            .get<string>(PreviewConfigurationField.FONT_FAMILY, "")
            .trim()
        this.fontSize = configuration
            .get<string>(PreviewConfigurationField.FONT_SIZE, "")
            .trim()
        this.lineHeight = configuration.get<number>(
            PreviewConfigurationField.LINE_HEIGHT,
            0,
        )
        this.maxWidth = configuration
            .get<string>(PreviewConfigurationField.MAX_WIDTH, "")
            .trim()
        this.customStyleCSS = configuration
            .get<string>(PreviewConfigurationField.CUSTOM_CSS, "")
            .trim()
        this.customStyleSheets = configuration.get<string[]>(
            PreviewConfigurationField.CUSTOM_SHEETS,
            [],
        )
        this.customStyleIncludeDefault = configuration.get<boolean>(
            PreviewConfigurationField.CUSTOM_INCLUDE_DEFAULT,
            true,
        )
    }

    /**
     * プレビューのスタイル設定が等しいかどうかを比較する
     *
     * @param other プレビューのスタイル設定
     * @returns 等しい場合`true`
     */
    equals(other: PreviewStyleConfiguration): boolean {
        return equalsRecord(this, other)
    }
}
