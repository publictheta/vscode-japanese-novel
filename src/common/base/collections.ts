/**
 * 配列が同値かどうか比較する
 *
 * @param a 配列
 * @param b 配列
 * @param eq 配列の要素が同値かを比較する関数
 * @returns
 */
export function equalsArray(
    a: unknown[],
    b: unknown[],
    eq: (a: unknown, b: unknown) => boolean = (a, b) => a === b,
): boolean {
    if (a.length !== b.length) {
        return false
    }

    for (let i = 0, len = a.length; i < len; i++) {
        if (!eq(a[i], b[i])) {
            return false
        }
    }

    return true
}

/**
 * オブジェクトがレコードとして同値かどうか比較する
 *
 * @param a オブジェクト
 * @param b オブジェクト
 * @param eq オブジェクトの生の値が同値かを比較する関数
 * @returns
 */
export function equalsRecord<T extends object>(
    a: T,
    b: T,
    eq: (a: unknown, b: unknown) => boolean = (a, b) => a === b,
) {
    for (const [name, valueA] of Object.entries(a)) {
        const valueB = b[name as keyof T]

        if (Array.isArray(valueA) && Array.isArray(valueB)) {
            if (!equalsArray(valueA, valueB, eq)) {
                return false
            }
        } else {
            if (!eq(valueA, valueB)) {
                return false
            }
        }
    }

    return true
}

/**
 * 双方向マップ
 */
export class BiMap<T, U> {
    private mapA: Map<T, U> = new Map()
    private mapB: Map<U, T> = new Map()

    set(a: T, b: U) {
        this.mapA.set(a, b)
        this.mapB.set(b, a)
    }

    has(a: T): boolean {
        return this.mapA.has(a)
    }

    hasReverse(b: U): boolean {
        return this.mapB.has(b)
    }

    get(a: T): U | undefined {
        return this.mapA.get(a)
    }

    getReverse(b: U): T | undefined {
        return this.mapB.get(b)
    }

    delete(a: T) {
        const b = this.mapA.get(a)

        if (b === undefined) {
            return
        }

        this.mapA.delete(a)
        this.mapB.delete(b)
    }

    deleteReverse(b: U) {
        const a = this.mapB.get(b)

        if (a === undefined) {
            return
        }

        this.mapA.delete(a)
        this.mapB.delete(b)
    }

    clear() {
        this.mapA.clear()
        this.mapB.clear()
    }

    *keys() {
        yield* this.mapA.keys()
    }

    *values() {
        yield* this.mapA.values()
    }

    *entries() {
        yield* this.mapA.entries()
    }
}
