import * as vscode from "vscode"

import {
    PREVIEW_CONFIGURATION,
    PREVIEW_CONFIGURATION_FIELD,
    Orientation,
    ORIENTATION,
} from "../../base/consts"
import { eqRecord } from "../../base/collections"

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
            PREVIEW_CONFIGURATION
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
            PREVIEW_CONFIGURATION_FIELD.ORIENTATION,
            ORIENTATION.HORIZONTAL
        )
    }

    /**
     * プレビューのレイアウト設定が等しいかどうかを比較する
     *
     * @param other プレビューのレイアウト設定
     * @returns 等しい場合`true`
     */
    equals(other: PreviewLayoutConfiguration): boolean {
        return eqRecord(this, other)
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
            .get<string>(PREVIEW_CONFIGURATION_FIELD.FONT_FAMILY, "")
            .trim()
        this.fontSize = configuration
            .get<string>(PREVIEW_CONFIGURATION_FIELD.FONT_SIZE, "")
            .trim()
        this.lineHeight = configuration.get<number>(
            PREVIEW_CONFIGURATION_FIELD.LINE_HEIGHT,
            0
        )
        this.maxWidth = configuration
            .get<string>(PREVIEW_CONFIGURATION_FIELD.MAX_WIDTH, "")
            .trim()
        this.customStyleCSS = configuration
            .get<string>(PREVIEW_CONFIGURATION_FIELD.CUSTOM_CSS, "")
            .trim()
        this.customStyleSheets = configuration.get<string[]>(
            PREVIEW_CONFIGURATION_FIELD.CUSTOM_SHEETS,
            []
        )
        this.customStyleIncludeDefault = configuration.get<boolean>(
            PREVIEW_CONFIGURATION_FIELD.CUSTOM_INCLUDE_DEFAULT,
            true
        )
    }

    /**
     * プレビューのスタイル設定が等しいかどうかを比較する
     *
     * @param other プレビューのスタイル設定
     * @returns 等しい場合`true`
     */
    equals(other: PreviewStyleConfiguration): boolean {
        return eqRecord(this, other)
    }
}
