import { splitLines } from "./string"
import { TextRange } from "./position"

/**
 * テキストに対するパッチ
 */
export type Patch = {
    /**
     * 置換される範囲
     */
    range: TextRange
    /**
     * 新しいテキスト
     */
    text: string
}

/**
 * 行
 */
export type Line<T> = {
    /**
     * 行のテキスト
     */
    text: string
    /**
     * 行に関連づけられたデータ
     */
    data: T
}

/**
 * 行ベースのデータへのパッチをインプレイスでマージする
 *
 * @param lines インプレイスで更新される行ベースのデータ
 * @param patches データへのパッチ
 * @param on データを更新するためのコールバック
 */
export function merge<T>(
    lines: Line<T>[],
    patches: Readonly<Patch[]>,
    on: {
        /**
         * 行の作成時に呼ばれるコールバック
         *
         * @param newText 作成される行のテキスト
         * @param index 作成される行のインデックス
         * @returns 作成される行に結び付けられるデータ
         */
        create(newText: string, index: number): T
        /**
         * 行の更新時に呼ばれるコールバック
         *
         * @param newText 更新される行の新しいテキスト
         * @param oldData 更新される行の古いデータ
         * @param oldText 更新される行の古いテキスト
         * @param index 更新される行のインデックス
         * @returns 更新される行の新しいデータ
         */
        update(newText: string, oldData: T, oldText: string, index: number): T
        /**
         * 行の削除時に呼ばれるコールバック
         *
         * @param oldData 作成される行のデータ
         * @param oldText 作成される行のテキスト
         * @param index 作成される行のインデックス
         */
        remove(oldData: T, oldText: string, index: number): void
    },
): void {
    if (patches.length === 0) {
        return
    }

    for (const { range, text } of patches) {
        const { start, end } = range

        // 更新される範囲の行のテキストを用意する
        const newTextLines = splitLines(text)
        newTextLines[0] =
            lines[start.line].text.slice(0, start.character) + newTextLines[0]
        newTextLines[newTextLines.length - 1] =
            newTextLines[newTextLines.length - 1] +
            lines[end.line].text.slice(end.character)

        // 削除の必要がない行のデータを更新する
        const oldLength = end.line - start.line + 1
        const min = Math.min(newTextLines.length, oldLength)

        for (let i = 0; i < min; i++) {
            const index = start.line + i
            const line = lines[index]
            const newText = newTextLines[i]
            line.data = on.update(newText, line.data, line.text, index)
            line.text = newText
        }

        // 行の増減を求める
        const delta = newTextLines.length - oldLength
        const deltaStart = start.line + min

        if (delta < 0) {
            // 行数が減る場合は削除を行う
            let index = deltaStart

            for (const line of lines.splice(deltaStart, -delta)) {
                on.remove(line.data, line.text, index)
                index += 1
            }
        } else if (delta > 0) {
            // 行数が増える場合は挿入を行う
            const newLines = []

            for (let i = 0; i < delta; i++) {
                const index = start.line + min + i
                const newText = newTextLines[min + i]
                const data = on.create(newText, index)
                newLines.push({ data, text: newText })
            }

            lines.splice(deltaStart, 0, ...newLines)
        }
    }
}
