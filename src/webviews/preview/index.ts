import { WebviewApi } from "vscode-webview"

import { BiMap } from "../../common/base/collections"
import { merge } from "../../common/base/merge"
import { TextRange, TextSelection } from "../../common/base/position"
import { lineToHTML } from "../../common/base/string"
import {
    PREVIEW_CSS_CLASS_NAME_CONTAINER,
    PREVIEW_CSS_CLASS_NAME_SELECTED,
    Orientation,
    PREVIEW_CSS_CLASS_NAME_VERTICAL,
    PREVIEW_CSS_CLASS_NAME_HORIZONTAL,
    PreviewState,
    PreviewStyle,
} from "../../common/features/preview/const"
import {
    ExtensionMessage,
    OrientationChangeMessage,
    ORIENTATION_CHANGE_MESSAGE,
    PatchMessage,
    PATCH_MESSAGE,
    ReloadMessage,
    RELOAD_MESSAGE,
    SelectionChangeMessage,
    SELECTION_CHANGE_MESSAGE,
    StyleChangeMessage,
    STYLE_CHANGE_MESSAGE,
    UriChangeMessage,
    URI_CHANGE_MESSAGE,
    VisibleRangesChangeMessage,
    VISIBLE_RANGES_CHANGE_MESSAGE,
} from "../../common/features/preview/messages/extension"
import {
    RequestReloadMessage,
    RequestRevealEditorMessage,
    WebviewMessage,
} from "../../common/features/preview/messages/webview"

import "./index.scss"

document.addEventListener("DOMContentLoaded", () => {
    new Preview(
        acquireVsCodeApi(),
        document.body.querySelector(
            `div.${PREVIEW_CSS_CLASS_NAME_CONTAINER}`,
        ) as HTMLDivElement,
        new DefaultRenderer(),
    )
})

/**
 * 各行のレンダーを担当する
 */
type IRenderer<T extends HTMLElement = HTMLElement> = {
    /**
     * 行のテキストから要素を生成する
     *
     * @param text 行のテキスト
     * @returns 行の要素
     */
    create(text: string): T
    /**
     * 行の要素を新しいテキストによって更新する
     *
     * @param text 新しい行のテキスト
     * @param element 古い行の要素
     * @returns 新しい行の要素
     */
    update(text: string, element: T): T
    /**
     * 行の要素を削除する
     *
     * @param element 古い行の要素
     */
    remove(element: T): void
    /**
     * 行の選択を追加する
     * @param element 行の要素
     */
    selectionAdd(element: T): void
    /**
     * 行の選択を削除する
     * @param element 行の要素
     */
    selectionRemove(element: T): void
}

/**
 * デフォルトのレンダラー
 */
class DefaultRenderer implements IRenderer {
    private render(element: HTMLElement, text: string) {
        const html = lineToHTML(text)

        if (html) {
            element.innerHTML = html
        } else {
            element.innerHTML = "<br/>"
        }

        return element
    }

    create(text: string) {
        return this.render(document.createElement("p"), text)
    }

    update(text: string, element: HTMLElement) {
        return this.render(element, text)
    }

    remove() {
        // noop
    }

    selectionAdd(element: HTMLElement) {
        element.classList.add(PREVIEW_CSS_CLASS_NAME_SELECTED)
    }

    selectionRemove(element: HTMLElement) {
        element.classList.remove(PREVIEW_CSS_CLASS_NAME_SELECTED)
    }
}

/**
 * 行のデータ
 */
type Line = {
    text: string
    data: HTMLElement
}

/**
 * プレビュー
 */
class Preview {
    private api: WebviewApi<PreviewState>
    private container: HTMLElement
    private renderer: IRenderer
    private observer: ResizeObserver
    private lines: Line[] = []

    constructor(
        api: WebviewApi<PreviewState>,
        container: HTMLElement,
        renderer: IRenderer,
    ) {
        this.api = api
        this.container = container
        this.renderer = renderer

        this.handleClick = this.handleClick.bind(this)
        this.handleResize = this.handleResize.bind(this)
        this.handleMessage = this.handleMessage.bind(this)

        this.observer = new ResizeObserver(this.handleResize)
        this.container.addEventListener("click", this.handleClick)
        window.addEventListener("message", this.handleMessage)
        this.post(RequestReloadMessage.create())
    }

    dispose() {
        window.removeEventListener("message", this.handleMessage)
        this.container.removeEventListener("click", this.handleClick)
        this.observer.disconnect()

        this.lines = []
        this.container.innerHTML = ""

        this.mapStyle.clear()
        this.mapLink.clear()
    }

    // MARK: APIへのアクセス

    post(message: WebviewMessage) {
        this.api.postMessage(message)
    }

    setState(state: PreviewState) {
        this.api.setState(state)
    }

    // MARK: クリックの処理

    /**
     * クリックされた段落をエディターで表示させるようメッセージを送る
     *
     * @param event
     */
    private handleClick(event: MouseEvent) {
        const { container, lines } = this

        let target = event.target as Node | null

        if (target === container) {
            return
        }

        while (target) {
            const parent = target.parentNode

            if (parent === container) {
                break
            }

            target = parent
        }

        if (target === null) {
            return
        }

        for (const [i, line] of lines.entries()) {
            if (line.data !== target) {
                continue
            }

            this.post(
                RequestRevealEditorMessage.create({
                    start: {
                        line: i,
                        character: 0,
                    },
                    end: {
                        line: i,
                        character: line.text.length,
                    },
                }),
            )
            return
        }
    }

    // MARK: リサイズの処理
    //
    // 最初のDOMの読み込みに時間がかかる場合、縦書きのスクロール位置がうまく反映されないため、
    // サイズの変更を監視して、スクロール位置を反映させる。
    //

    private resizeCountToObserve = 0

    /**
     * 指定回数のリサイズの監視を開始する
     *
     * @param target リサイズを監視する対象
     * @param count リサイズを監視する回数
     */
    private observeResize(target: HTMLElement, count: number) {
        this.resizeCountToObserve = count
        this.observer.observe(target)
    }

    /**
     * 指定回数後`doUpdateScrollPosition`を呼ぶ`ResizeObserver`のコールバック
     */
    private handleResize(
        entries: ResizeObserverEntry[],
        observer: ResizeObserver,
    ) {
        const container = this.container

        for (const entry of entries) {
            if (entry.target !== container) {
                observer.unobserve(entry.target)
                continue
            }

            this.resizeCountToObserve -= 1

            if (this.resizeCountToObserve > 0) {
                continue
            }

            observer.unobserve(container)

            this.doUpdateScrollPosition()
        }
    }

    // MARK: メッセージの処理

    /**
     * `window`の`MessageEvent`を処理する
     *
     * @param event メッセージを含むイベント
     */
    private handleMessage(event: MessageEvent) {
        const message = event.data as ExtensionMessage

        switch (message.kind) {
            case PATCH_MESSAGE:
                this.handlePatch(message)
                break
            case SELECTION_CHANGE_MESSAGE:
                this.handleSelectionChange(message)
                break
            case VISIBLE_RANGES_CHANGE_MESSAGE:
                this.handleVisibleRangesChange(message)
                break
            case URI_CHANGE_MESSAGE:
                this.handleUriChange(message)
                break
            case ORIENTATION_CHANGE_MESSAGE:
                this.handleOrientationChange(message)
                break
            case STYLE_CHANGE_MESSAGE:
                this.handleStyleChange(message)
                break
            case RELOAD_MESSAGE:
                this.handleReload(message)
                break
        }
    }

    /**
     * `UriChangeMessage`を処理する
     *
     * @param message
     */
    private handleUriChange(message: UriChangeMessage) {
        this.setState({ uri: message.uri })
    }

    /**
     * `ReloadMessage`を処理する
     *
     * @param message
     */
    private handleReload(message: ReloadMessage) {
        this.setState({
            uri: message.document.uri,
        })

        const { container, lines } = this

        // サイズの変更を2回であると想定する
        this.observeResize(container, 2)

        container.innerHTML = ""

        this.updateOrientation(message.configuration.orientation)
        this.updateStyle(message.configuration.style)

        const renderer = this.renderer

        for (const text of message.document.lines) {
            lines.push({ data: renderer.create(text), text })
        }

        for (const line of lines) {
            container.appendChild(line.data)
        }

        if (message.editor) {
            const { selection, visibleRanges } = message.editor
            this.updateSelection(selection)
            this.updateVisibleRanges(visibleRanges)
        } else {
            this.updateSelection(undefined)
            this.updateVisibleRanges([])
        }

        this.updateScrollPosition()
    }

    /**
     * `PatchMessage`を処理する
     *
     * @param message
     */
    private handlePatch(message: PatchMessage) {
        const { container } = this

        let ref: Node | null = null

        const renderer = this.renderer

        merge(this.lines, message.patches, {
            create(newText, index) {
                if (ref === null) {
                    if (container.childElementCount > index) {
                        ref = container.children.item(index)
                    }
                }

                const element = renderer.create(newText)
                return container.insertBefore(element, ref)
            },
            update(newText, oldData) {
                return renderer.update(newText, oldData)
            },
            remove(oldData) {
                renderer.remove(oldData)
                oldData.remove()
            },
        })
    }

    /**
     * `OrientationChangeMessage`を処理する
     *
     * @param message
     */
    private handleOrientationChange(message: OrientationChangeMessage) {
        this.updateOrientation(message.orientation)
        this.updateScrollPosition()
    }

    /**
     * `StyleChangeMessage`を処理する
     *
     * @param message
     */
    private handleStyleChange(message: StyleChangeMessage) {
        this.updateStyle(message)
        this.updateScrollPosition()
    }

    /**
     * `SelectionChangeMessage`を処理する
     *
     * @param message
     */
    private handleSelectionChange(message: SelectionChangeMessage): void {
        this.updateSelection(message.selection)
        this.updateScrollPosition()
    }

    /**
     * `VisibleRangesChangeMessage`を処理する
     *
     * @param message
     */
    private handleVisibleRangesChange(
        message: VisibleRangesChangeMessage,
    ): void {
        this.updateVisibleRanges(message.visibleRanges)
        this.updateScrollPosition()
    }

    // MARK: 内部処理

    private orientation: Orientation | null = null

    /**
     * レイアウト方向を更新する
     *
     * @param orientation
     */
    private updateOrientation(orientation: Orientation) {
        if (this.orientation === orientation) {
            return
        }

        const container = this.container

        switch (orientation) {
            case Orientation.HORIZONTAL:
                container.classList.remove(PREVIEW_CSS_CLASS_NAME_VERTICAL)
                container.classList.add(PREVIEW_CSS_CLASS_NAME_HORIZONTAL)
                break
            case Orientation.VERTICAL:
                container.classList.remove(PREVIEW_CSS_CLASS_NAME_HORIZONTAL)
                container.classList.add(PREVIEW_CSS_CLASS_NAME_VERTICAL)
                break
        }

        this.orientation = orientation
    }

    private mapStyle = new BiMap<string, HTMLStyleElement>()
    private mapLink = new BiMap<string, HTMLLinkElement>()

    /**
     * スタイルを更新する
     */
    private updateStyle({ styles, sheets }: PreviewStyle) {
        const { mapStyle, mapLink } = this

        const toRemoveStyle = new Set(mapStyle.values())
        const toAppendStyle = new Set<HTMLStyleElement>()

        for (const css of styles) {
            let style = mapStyle.get(css)

            if (style) {
                toRemoveStyle.delete(style)
            } else {
                style = document.createElement("style")
                style.textContent = css
                mapStyle.set(css, style)
                toAppendStyle.add(style)
            }
        }

        const toRemoveLink = new Set(mapLink.values())
        const toAppendLink = new Set<HTMLLinkElement>()

        for (const element of mapLink.values()) {
            toRemoveLink.add(element)
        }

        for (const href of sheets) {
            let link = mapLink.get(href)

            if (link) {
                toRemoveLink.delete(link)
            } else {
                link = document.createElement("link")
                link.rel = "stylesheet"
                link.href = href
                mapLink.set(href, link)
                toAppendLink.add(link)
            }
        }

        for (const element of toRemoveStyle) {
            mapStyle.deleteReverse(element)
            element.remove()
        }

        for (const element of toRemoveLink) {
            mapLink.deleteReverse(element)
            element.remove()
        }

        const head = document.head

        for (const element of toAppendStyle) {
            head.appendChild(element)
        }

        for (const element of toAppendLink) {
            head.appendChild(element)
        }
    }

    // MARK: 選択範囲と表示範囲

    /**
     * エディターの選択範囲
     */
    private selection?: TextSelection | undefined = undefined

    /**
     * エディターの表示範囲
     */
    private visibleRanges: TextRange[] = []

    /**
     * プレビューで選択されている行のインデックス
     */
    private selectedIndex: number | undefined = undefined
    /**
     * プレビューで選択されている行の要素
     */
    private selectedElement: HTMLElement | undefined = undefined

    /**
     * 選択範囲を更新する
     *
     * @param selection 現在の選択範囲
     */
    private updateSelection(selection: TextSelection | undefined): void {
        const selectionLine =
            selection === undefined ? undefined : selection.active.line

        if (this.selectedIndex === selectionLine) {
            return
        }

        if (this.selectedElement) {
            this.renderer.selectionRemove(this.selectedElement)
        }

        this.selection = selection
        this.selectedIndex = selectionLine

        if (selectionLine !== undefined) {
            const line = this.lines[selectionLine]

            if (line) {
                this.selectedElement = line.data
                this.renderer.selectionAdd(line.data)
            }
        }
    }

    /**
     * 表示範囲を更新する
     *
     * @param selection 現在の選択範囲
     * @param visibleRanges 現在の表示範囲
     */
    private updateVisibleRanges(visibleRanges: TextRange[]): void {
        this.visibleRanges = visibleRanges
    }

    private tickingUpdateScrollPosition = false

    /**
     * スクロール位置を更新する
     */
    private updateScrollPosition(): void {
        // 更新頻度を抑える
        if (this.tickingUpdateScrollPosition) {
            return
        }

        this.tickingUpdateScrollPosition = true

        window.requestAnimationFrame(() => {
            this.doUpdateScrollPosition()
            this.tickingUpdateScrollPosition = false
        })
    }

    /**
     * スクロール位置の更新を実行する
     *
     * @param behavior スクロールの振る舞い
     * @returns
     */
    private doUpdateScrollPosition(behavior?: "auto" | "smooth"): void {
        const { lines, visibleRanges, selection } = this

        if (lines.length <= 0) {
            return
        }

        const visibleRange = visibleRanges[0]

        if (!visibleRange && !selection) {
            return
        }

        const lineIndex =
            selection && TextRange.overlaps(selection, visibleRange)
                ? selection.active.line
                : visibleRange.start.line

        lines[Math.min(lineIndex, lines.length - 1)].data.scrollIntoView({
            behavior,
            block: "nearest",
            inline: "nearest",
        })
    }
}
