import type * as MarkdownIt from "markdown-it"
import type StateInline from "markdown-it/lib/rules_inline/state_inline"
import type Token from "markdown-it/lib/token"

const enum TagName {
    Ruby = "ruby",
    Rt = "rt",
    Em = "em",
    Span = "span",
}

const SKIP = Symbol()

const REGEX_TOKENIZE =
    /(?:[|｜]([^|｜《》\n\r`*_[\]()]+)《([^《》\n\r`*_[\]()]+)》)|(?:([\p{sc=Han}〆ヶ]+)《([^《》\n\r`*_[\]()]+)》)|(?:(?<=^|[^|｜])《《([^\n\r`*_[\]()]+?)》》)/u

function tokenize(state: StateInline) {
    if ((state.env as { [SKIP]?: boolean })[SKIP]) {
        return false
    }

    const input = state.src.slice(state.pos, state.posMax)
    const match = REGEX_TOKENIZE.exec(input)

    if (!match) {
        return false
    }

    const out: Token[] = []
    state.md.inline.parse(
        input.slice(0, match.index),
        state.md,
        { ...state.env, [SKIP]: true },
        out,
    )
    state.tokens.push(...out)
    state.pos += match.index + match[0].length

    let text = match[1]

    if (text) {
        pushRuby(text, match[2])
        return true
    }

    text = match[3]

    if (text) {
        pushRuby(text, match[4])
        return true
    }

    text = match[5]
    pushDots(match[5])
    return true

    function pushRuby(text: string, ruby: string) {
        pushOpen(state, TagName.Ruby)
        pushText(state, text)
        pushOpen(state, TagName.Rt)
        pushText(state, ruby)
        pushClose(state, TagName.Rt)
        pushClose(state, TagName.Ruby)
    }

    function pushDots(text: string) {
        pushOpen(state, TagName.Em).attrSet("class", "japanese-novel-dots")
        for (const char of text) {
            pushOpen(state, TagName.Span)
            pushText(state, char)
            pushClose(state, TagName.Span)
        }
        pushClose(state, TagName.Em)
    }

    function pushOpen(state: StateInline, tagName: TagName): Token {
        return state.push(`${tagName}_open`, tagName, 1)
    }

    function pushClose(state: StateInline, tagName: TagName): Token {
        return state.push(`${tagName}_close`, tagName, -1)
    }

    function pushText(state: StateInline, content: string): Token {
        const token = state.push(`text`, ``, 0)
        token.content = content
        return token
    }
}

export const markdownItJapaneseNovel: MarkdownIt.PluginSimple = md => {
    md.inline.ruler.before("text", "japanese-novel", tokenize)
}

export default markdownItJapaneseNovel
