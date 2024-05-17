module.exports = {
    extends: "../../.eslintrc.json",
    env: {
        es6: true,
        node: false,
        browser: false,
    },
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: "./tsconfig.json",
    },
}
