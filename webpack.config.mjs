// @ts-check
"use strict"

/**
 * @typedef {import("webpack").Configuration} WebpackConfig
 */
import path from "node:path"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import TerserPlugin from "terser-webpack-plugin"

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const DIST = "dist"

/**
 * @returns { WebpackConfig["optimization"] }
 */
function createOptimization() {
    return {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                minify: TerserPlugin.swcMinify,
                // https://swc.rs/docs/configuration/minification
                terserOptions: {
                    compress: {},
                    mangle: {},
                },
            }),
        ],
    }
}

/**
 * @param { WebpackConfig["entry"] } entry
 * @param { "production" | "development" } mode
 * @returns { WebpackConfig }
 */
function createWebViewsConfig(entry, mode) {
    const isProd = mode === "production"
    const isDev = !isProd

    return {
        mode,
        name: "webviews",
        target: "web",
        entry: entry,
        output: {
            path: path.resolve(__dirname, DIST, "webviews"),
            filename: "[name].js",
            clean: true,
        },
        devtool: isProd ? undefined : "inline-source-map",
        optimization: isDev ? undefined : createOptimization(),
        module: {
            rules: [
                {
                    test: /\.([jt]sx?)?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "swc-loader",
                        // https://swc.rs/docs/configuration/compilation
                        options: {
                            jsc: {
                                parser: {
                                    syntax: "typescript",
                                },
                            },
                        },
                    },
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
 * @returns {WebpackConfig }
 */
function createExtensionConfig(target, mode) {
    const name = target === "node" ? "node" : "browser"
    const isProd = mode === "production"
    const isDev = !isProd

    return {
        name: `extension:${name}`,
        target,
        mode,
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
        optimization: isDev ? undefined : createOptimization(),
        module: {
            rules: [
                {
                    test: /\.([jt]sx?)?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "swc-loader",
                        // https://swc.rs/docs/configuration/compilation
                        options: {
                            jsc: {
                                parser: {
                                    syntax: "typescript",
                                },
                            },
                        },
                    },
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
 * @param { WebpackConfig["entry"] } entry
 * @param { "production" | "development" } mode
 * @returns { WebpackConfig }
 */
function createStylesConfig(entry, mode) {
    const isProd = mode === "production"
    const isDev = !isProd

    return {
        mode,
        target: "web",
        name: "styles",
        entry: entry,
        output: {
            path: path.resolve(__dirname, DIST, "styles"),
            clean: true,
        },
        devtool: isProd ? undefined : "inline-source-map",
        optimization: isDev ? undefined : createOptimization(),
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

/**
 * @param {{}} env
 * @param {{ mode?: "production" | "development" | "none" }} argv
 * @returns { Promise<WebpackConfig[]> }
 */
export default async function (env, argv) {
    const mode = argv.mode === "production" ? "production" : "development"

    return Promise.all([
        createExtensionConfig("node", mode),
        createExtensionConfig("webworker", mode),
        createWebViewsConfig(
            { preview: "./src/webviews/preview/index.ts" },
            mode,
        ),
        createStylesConfig(
            {
                "markdown/preview": "./src/styles/markdown/preview.scss",
            },
            mode,
        ),
    ])
}
