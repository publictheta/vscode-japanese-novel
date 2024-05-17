module.exports = {
    extends: "../../.eslintrc.json",
    env: {
        node: false,
        worker: true,
    },
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: "./tsconfig.json",
    },
}
