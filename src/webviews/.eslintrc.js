module.exports = {
    extends: "../../.eslintrc.json",
    env: {
        node: false,
        browser: true,
    },
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: "./tsconfig.json",
    },
}
