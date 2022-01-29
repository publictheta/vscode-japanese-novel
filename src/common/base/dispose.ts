import * as vscode from "vscode"

/**
 * `vscode.Disposable`を実装するための基底クラス
 */
export abstract class Disposable implements vscode.Disposable {
    subscriptions: vscode.Disposable[] = []

    dispose() {
        const { subscriptions } = this
        for (let i = subscriptions.length; i > 0; i--) {
            const subscription = subscriptions.pop()

            if (!subscription) {
                break
            }

            subscription.dispose()
        }
    }

    register<T extends vscode.Disposable>(disposable: T): T {
        this.subscriptions.push(disposable)
        return disposable
    }
}
