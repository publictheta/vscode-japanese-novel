/**
 * デフォルトの縦棒（全角）
 */
export const CHAR_VERTICAL_BAR = "｜" as const

/**
 * 全角スペース
 */
export const CHAR_FULLWIDTH_SPACE = "\u{3000}" as const

/**
 * 注記用の特殊な記号にマッチする正規表現
 */
export const REGEX_SPECIAL = /[\r\n|｜《》]/g

/**
 * すべてが漢字であるときマッチする正規表現
 */
export const REGEX_ALL_HAN = /^[\p{sc=Han}〆ヶ]+$/gu

/**
 * 行頭のスペースと最初の一文字（記号または記号以外）にマッチする正規表現
 */
export const REGEX_SPACE_AND_CHAR_AT_LINE_START =
    /^([\p{Zs}]*)(?:([\p{P}])|[^\p{P}])/mu

/**
 * 行頭のスペースにがあるときそれにマッチする正規表現
 */
export const REGEX_SPACE_AT_LINE_START = /^([\p{Zs}]+)/mu

/**
 * HTMLの特殊文字をエスケープする
 *
 * @param string HTML
 * @returns エスケープされた文字列
 */
function escapeHTML(string: string): string {
    return string.replace(/[&<>"']/g, (match: string) => {
        return {
            "&": "&amp",
            "<": "&lt",
            ">": "&gt",
            '"': "&quot",
            "'": "&#39",
        }[match] as string
    })
}

/**
 * `toPlain`で使う正規表現
 */
const REGEX_TO_PLAIN =
    /(?:[|｜]([^|｜《》\n\r]+)《[^《》\n\r]+》)|(?:([\p{sc=Han}〆ヶ]+)《[^《》\n\r]+》)|(?:(^|[^|｜])《《([^\n\r]+?)》》)/gmu

/**
 * 注記を取り除く
 *
 * @param string 注記を含む文字列
 * @returns 注記を含まない文字列
 */
export function toPlain(string: string): string {
    return string.replace(
        REGEX_TO_PLAIN,
        (
            _: string,
            text: string | undefined,
            han_text: string | undefined,
            prefix: string | undefined,
            content: string | undefined
        ) => {
            if (text === undefined) {
                text = han_text
            }

            if (text === undefined) {
                return (prefix || "") + (content || "")
            }

            return text
        }
    )
}

/**
 * 与えられた文字列を行に分割する
 *
 * @param string 文字列
 * @returns 行の配列
 */
export function splitLines(string: string): string[] {
    return string.split(/\r?\n/g)
}

/**
 * `lineToHTML`で使う正規表現
 */
const REGEX_LINE_TO_HTML =
    /(?:[|｜]([^|｜《》\n\r]+)《([^《》\n\r]+)》)|(?:([\p{sc=Han}〆ヶ]+)《([^《》\n\r]+)》)|(?:(^|[^|｜])《《([^\n\r]+?)》》)/gmu

/**
 * 注記を含む単一行の文字列をHTMLに変換する
 *
 * @param string 注記を含む単一行の文字列
 * @returns HTML
 */
export function lineToHTML(string: string): string {
    function spans(string: string): string {
        let buf = ""

        for (const char of string) {
            buf += `<span>${char}</span>`
        }

        return buf
    }

    return escapeHTML(string).replace(
        REGEX_LINE_TO_HTML,
        (
            _: string,
            text: string | undefined,
            ruby: string | undefined,
            han_text: string | undefined,
            han_ruby: string | undefined,
            prefix: string | undefined,
            content: string | undefined
        ) => {
            if (text === undefined) {
                text = han_text
                ruby = han_ruby
            }

            if (text === undefined) {
                return (prefix || "") + "<em>" + spans(content || "") + "</em>"
            }

            return `<ruby>${text}<rt>${ruby || ""}</rt></ruby>`
        }
    )
}

/**
 * 注記を含む複数行の文字列をHTMLに変換する
 *
 * @param string 注記を含む文字列
 * @returns HTML
 */
export function linesToHTML(string: string): string {
    return splitLines(string)
        .map(line => `<p>${lineToHTML(line) || `<br>`}</p>`)
        .join("")
}

/**
 * `toRubyOnly`で使う正規表現
 */
const REGEX_TO_RUBY_ONLY = /(^|[^|｜])《《([^\n\r]+?)》》/gu

/**
 * ルビ注記のみの文字列に変換する
 *
 * @param string 傍点注記を含んだ文字列
 * @returns ルビ注記のみを含んだ文字列
 */
export function toRubyOnly(string: string): string {
    function dots(string: string): string {
        let buf = ""

        for (const char of string) {
            buf += `｜${char}《・》`
        }

        return buf
    }

    return string.replace(
        REGEX_TO_RUBY_ONLY,
        (
            _: string,
            prefix: string | undefined,
            content: string | undefined
        ) => {
            return (prefix || "") + dots(content || "")
        }
    )
}
