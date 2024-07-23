const path = require("path");
const fsExtra = require("fs-extra");
const webpack = require('webpack');

describe("app-settings-loader and webpack integration", () => {
    const outputPath = path.resolve(__dirname, "../dist");
    afterEach(() => { fsExtra.remove(outputPath); });

    /**
     * @param {Error | null} err 
     * @param {webpack.Stats | undefined} stats 
     * @param {string} expectedFileName 
     * @param {unknown} content 
     */
    function assertBuild(err, stats, expectedFileName, content) {
        expect(!!(err || stats.hasErrors())).toBe(false);
        const statsSource = stats.toJson({ source: true });
        const settings = statsSource.modules.find((m) => m.name.includes(expectedFileName));
        expect(!!settings).toBe(true);
        expect(JSON.parse(settings.source)).toEqual(content);
    }

    /**
     * @param {string} entry entry file name
     * @param {RegExp} settingsFilePattern
     * @param {string} env environment name
     */
    function createWebpackConfig(entry, settingsFilePattern, env) {
        return {
            entry,
            output: { path: outputPath },
            module: {
                rules: [
                    { test: /\.ts$/, loader: "ts-loader" },
                    { test: settingsFilePattern, loader: path.resolve(__dirname, "../index"), options: { env } }
                ]
            }
        };
    }

    for (const { text, fileName } of [
        { text: "TS file with ES6 import", fileName: "es6.ts" },
        { text: "TS file with require", fileName: "require.ts" },
        { text: "jS file with ES6 import", fileName: "es6.js" },
        { text: "jS file with require", fileName: "require.js" },
    ]) {
        const entry = path.resolve(__dirname, `./resources/${fileName}`);
        it(`works without error - for ${text}`, () => new Promise((resolve, reject) => {
            webpack(
                createWebpackConfig(entry, /app-settings\.json$/i, "production"),
                (err, stats) => {
                    try {
                        assertBuild(err, stats, "app-settings.json", { debug: false, apiKey: "123-456", cacheDuration: 5000 });
                        resolve();
                    } catch (err) { reject(err); }
                });
        }));
    }

    it(`returns the base settings if the environment file does not exist`, () => new Promise((resolve, reject) => {
        webpack(
            createWebpackConfig(path.resolve(__dirname, "./resources/es6-wo-override.ts"), /app-settings-wo-override\.json$/i, "test"),
            (err, stats) => {
                try {
                    assertBuild(err, stats, "app-settings-wo-override.json", { debug: true, apiKey: "test", cacheDuration: 5000 });
                    resolve();
                } catch (err) { reject(err); }
            });
    }));

    it(`throws error if the env json is malformed`, () => new Promise((resolve, reject) => {
        webpack(
            createWebpackConfig(path.resolve(__dirname, "./resources/es6.ts"), /app-settings\.json$/i, "malformed"),
            (err, stats) => {
                try {
                    expect(stats.hasErrors()).toBe(true);
                    expect(stats.toString()).toMatch(/Unable to parse the file .+app-settings.malformed.json; app-settings-loader can only be used to load and transform well-formed json files./)
                    resolve();
                } catch (e) { reject(e); }
            });
    }));
})