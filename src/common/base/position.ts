/**
 * テキスト内の位置
 */
export type TextPosition = {
    /**
     * 0-basedの行位置
     */
    line: number
    /**
     * 0-basedの文字位置
     */
    character: number
}

export namespace TextPosition {
    /**
     * `TextPosition`を複製する
     */
    export function clone({ line, character }: TextPosition): TextPosition {
        return { line, character }
    }

    /**
     * @returns `self < other`
     */
    export function isBefore(self: TextPosition, other: TextPosition): boolean {
        return (
            self.line < other.line ||
            (self.line === other.line && self.character < other.character)
        )
    }

    /**
     * @returns `self <= other`
     */
    export function isBeforeOrEqual(
        self: TextPosition,
        other: TextPosition,
    ): boolean {
        return (
            self.line < other.line ||
            (self.line === other.line && self.character <= other.character)
        )
    }

    /**
     * @returns `self == other`
     */
    export function isEqual(self: TextPosition, other: TextPosition): boolean {
        return self.line === other.line && self.character === other.character
    }

    /**
     * @returns `self > other`
     */
    export function isAfter(self: TextPosition, other: TextPosition): boolean {
        return (
            self.line > other.line ||
            (self.line === other.line && self.character > other.character)
        )
    }

    /**
     * @returns `self >= other`
     */
    export function isAfterOrEqual(
        self: TextPosition,
        other: TextPosition,
    ): boolean {
        return (
            self.line > other.line ||
            (self.line === other.line && self.character >= other.character)
        )
    }

    /**
     * @returns `-1 iff self < other, 0 iff self == other, 1 iff self > other`
     */
    export function compare(
        self: TextPosition,
        other: TextPosition,
    ): -1 | 0 | 1 {
        if (self.line < other.line) {
            return -1
        }

        if (self.line > other.line) {
            return 1
        }

        if (self.character < other.character) {
            return -1
        }

        if (self.character > other.character) {
            return 1
        }

        return 0
    }
}

/**
 * テキスト内の範囲
 */
export type TextRange = {
    /**
     * 始端の位置
     */
    start: TextPosition
    /**
     * 終端の位置
     */
    end: TextPosition
}

export namespace TextRange {
    /**
     * `TextRange`を複製する
     */
    export function clone({ start, end }: TextRange) {
        return {
            start: TextPosition.clone(start),
            end: TextPosition.clone(end),
        }
    }

    /**
     * @returns `self`が`other`を含むか同じ場合`true`
     */
    export function contains(self: TextRange, other: TextRange): boolean {
        return (
            TextPosition.isBeforeOrEqual(self.start, other.start) &&
            TextPosition.isBeforeOrEqual(other.end, self.end)
        )
    }

    /**
     * @returns 範囲が重なる場合`true`
     */
    export function overlaps(self: TextRange, other: TextRange): boolean {
        return (
            TextPosition.isBefore(other.start, self.end) &&
            TextPosition.isBefore(self.start, other.end)
        )
    }
}

/**
 * テキスト内の選択範囲
 */
export type TextSelection = TextRange & {
    /**
     * カーソルの位置
     */
    active: TextPosition
    /**
     * 選択の開始位置
     */
    anchor: TextPosition
}

export namespace TextSelection {
    /**
     * `TextSelection`を複製する
     */
    export function clone({
        start,
        end,
        active,
        anchor,
    }: TextSelection): TextSelection {
        return {
            start: TextPosition.clone(start),
            end: TextPosition.clone(end),
            active: TextPosition.clone(active),
            anchor: TextPosition.clone(anchor),
        }
    }
}
