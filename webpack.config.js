// @ts-check
"use strict"

/**
 * @typedef {import("webpack").Configuration} WebpackConfig
 */

const path = require("path")
const webpack = require("webpack")
const { ESBuildMinifyPlugin } = require("esbuild-loader")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")

const DIST = "dist"
const OUT = "out"
const ES_TARGET = "es2020"

/**
 * @param { {css?: boolean} } options
 * @returns { WebpackConfig["optimization"] }
 */
function createOptimization(options) {
    return {
        minimize: true,
        minimizer: [
            new ESBuildMinifyPlugin({
                format: "cjs",
                minify: true,
                treeShaking: true,
                target: ES_TARGET,
                css: options.css,
            }),
        ],
    }
}

/**
 * @param { WebpackConfig["entry"] } entry
 * @param { "production" | "development" } mode
 * @returns { Promise<WebpackConfig> }
 */
async function createWebViewsConfig(entry, mode) {
    const isProd = mode === "production"
    const isDev = !isProd

    return {
        mode: mode,
        name: "webviews",
        target: "web",
        entry: entry,
        output: {
            path: path.resolve(__dirname, DIST, "webviews"),
            filename: "[name].js",
            clean: true,
        },
        devtool: isProd ? undefined : "inline-source-map",
        optimization: isDev ? undefined : createOptimization({ css: true }),
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: "esbuild-loader",
                        options: {
                            loader: "tsx",
                            target: ES_TARGET,
                            tsconfigRaw: {},
                        },
                    },
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, "css-loader"],
                },
                {
                    test: /\.s[ac]ss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                        "sass-loader",
                    ],
                },
            ],
        },
        resolve: {
            extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
        },
        plugins: [new MiniCssExtractPlugin()],
    }
}

/**
 * @param { "node" | "webworker" } target
 * @param { "production" | "development" } mode
 * @returns { Promise<WebpackConfig> }
 */
async function createExtensionConfig(target, mode) {
    const name = target === "node" ? "node" : "browser"
    const isProd = mode === "production"
    const isDev = !isProd

    return {
        name: `extension:${name}`,
        target: target,
        mode: mode,
        entry: {
            extension: `./src/${name}/extension.ts`,
        },
        output: {
            path: path.resolve(__dirname, DIST, name),
            filename: "[name].js",
            library: {
                type: "commonjs",
            },
            clean: true,
        },
        devtool: isProd ? undefined : "source-map",
        optimization: isDev ? undefined : createOptimization({ css: false }),
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: {
                        loader: "esbuild-loader",
                        options: {
                            loader: "ts",
                            target: ES_TARGET,
                        },
                    },
                    exclude: /node_modules/,
                },
            ],
        },
        resolve: {
            extensions: [".ts", ".js", ".json"],
        },
        externals: {
            vscode: "commonjs vscode",
        },
    }
}

/**
 * @param { "node" | "webworker" } target
 * @param { "production" | "development" } mode
 * @returns { Promise<WebpackConfig> }
 */
async function createTestConfig(target, mode) {
    const name = target === "node" ? "node" : "browser"
    const isProd = mode === "production"
    const isDev = !isProd

    return {
        name: `test:${name}`,
        target: target,
        mode: mode,
        entry: {
            "suite/index": `./src/${name}/test/suite/index.ts`,
        },
        output: {
            path: path.resolve(__dirname, OUT, name, "test"),
            filename: "[name].js",
            library: {
                type: "commonjs",
            },
        },
        devtool: isProd ? undefined : "source-map",
        optimization: isDev ? undefined : createOptimization({ css: false }),
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: {
                        loader: "esbuild-loader",
                        options: {
                            loader: "ts",
                            target: ES_TARGET,
                        },
                    },
                    exclude: /node_modules/,
                },
            ],
        },
        resolve: {
            extensions: [".ts", ".js", ".json"],
            fallback: {
                assert: require.resolve("assert"),
            },
        },
        externals: {
            vscode: "commonjs vscode",
        },
        plugins: [
            new webpack.ProvidePlugin({
                process: "process/browser",
            }),
        ],
    }
}

/**
 * @param { WebpackConfig["entry"] } entry
 * @param { "production" | "development" } mode
 * @returns { Promise<WebpackConfig> }
 */
async function createStylesConfig(entry, mode) {
    const isProd = mode === "production"
    const isDev = !isProd

    return {
        mode: mode,
        target: "web",
        name: "styles",
        entry: entry,
        output: {
            path: path.resolve(__dirname, DIST, "styles"),
            clean: true,
        },
        devtool: isProd ? undefined : "inline-source-map",
        optimization: isDev ? undefined : createOptimization({ css: true }),
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, "css-loader"],
                },
                {
                    test: /\.s[ac]ss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                        "sass-loader",
                    ],
                },
            ],
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: "[name].css",
            }),
        ],
    }
}

module.exports =
    /**
     * @param {{ test?: boolean }} env
     * @param {{ mode?: "production" | "development" | "none" }} argv
     * @returns { Promise<WebpackConfig[]> }
     */
    async function (env, argv) {
        const mode = argv.mode === "production" ? "production" : "development"

        if (env.test) {
            return Promise.all([createTestConfig("webworker", mode)])
        }

        return Promise.all([
            createExtensionConfig("node", mode),
            createExtensionConfig("webworker", mode),
            createWebViewsConfig(
                { preview: "./src/webviews/preview/index.ts" },
                mode
            ),
            createStylesConfig(
                {
                    "markdown/preview": "./src/styles/markdown/preview.scss",
                },
                mode
            ),
        ])
    }
