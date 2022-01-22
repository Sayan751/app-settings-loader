const mock = require('mock-fs');
const path = require("path");
const fsExtra = require("fs-extra");
const webpack = require('webpack');
const loader = require("../index");

const basePath = "config/app-settings.json",
    prodPath = "config/app-settings.production.json",
    malformedPath = "config/app-settings.malformed.json",
    baseConfig = `{"debug": true, "apiKey": "test", "cacheDuration": 5000}`,
    malformedJson = `malformed json`,
    entry = "main.ts";

describe("app-settings-loader", () => {
    beforeEach(() => {
        mock({
            [basePath]: baseConfig,
            [prodPath]: `{"debug": false, "apiKey": "123-456"}`,
            [malformedPath]: malformedJson,
            [entry]: `import * as config from "${basePath}";\n\nconsole.log(config);`
        });
    });

    afterEach(() => { mock.restore(); });

    it("merges two settings file depending on the environment", () => {
        const context = { resourcePath: basePath, getOptions() { return { env: "production" }; } }
        const expected = JSON.parse(`{"debug": false, "apiKey": "123-456", "cacheDuration": 5000}`);
        const actual = JSON.parse(loader.call(context, baseConfig));
        expect(actual).toEqual(expected);
    });

    it("returns base settings if the environment file does not exist", () => {
        const context = { resourcePath: basePath, getOptions() { return { env: "test" }; } }
        const expected = JSON.parse(`{"debug": true, "apiKey": "test", "cacheDuration": 5000}`);
        const actual = JSON.parse(loader.call(context, baseConfig));
        expect(actual).toEqual(expected);
    });

    it("throws error if the env json is malformed", () => {
        const context = { resourcePath: basePath, getOptions() { return { env: "malformed" }; } }
        try {
            loader.call(context, baseConfig);
        } catch (e) {
            const re = /Unable to parse the file config[\\/]app-settings.malformed.json; app-settings-loader can only be used to load and transform well-formed json files./;
            expect(re.exec(e.message).length).toBeGreaterThanOrEqual(1);
        }
    });

    it("throws error if the base json is malformed", () => {
        const context = { resourcePath: malformedPath, getOptions() { return {}; } }
        try {
            loader.call(context, malformedJson);
        } catch (e) {
            const re = /Unable to parse the file config[\\/]app-settings.malformed.json; app-settings-loader can only be used to load and transform well-formed json files./;
            expect(re.exec(e.message).length).toBeGreaterThanOrEqual(1);
        }
    });
});

describe("app-settings-loader and webpack integration", () => {
    const outputPath = path.resolve(__dirname, "../dist");
    afterEach(() => { fsExtra.remove(outputPath); });

    [
        { text: "TS file with ES6 import", fileName: "es6.ts" },
        { text: "TS file with require", fileName: "require.ts" },
        { text: "jS file with ES6 import", fileName: "es6.js" },
        { text: "jS file with require", fileName: "require.js" },
    ].map(({ text, fileName }) =>
        it(`works without error - for ${text}`, async () => {
            return new Promise((resolve) => {
                webpack({
                    entry: path.resolve(__dirname, `./resources/${fileName}`),
                    output: { path: outputPath },
                    module: {
                        rules: [
                            { test: /\.ts$/, loader: "ts-loader" },
                            { test: /app-settings\.json$/i, loader: path.resolve(__dirname, "../index"), options: { env: 'production' } }
                        ]
                    }
                },
                    (err, stats) => {
                        expect(!!(err || stats.hasErrors())).toBe(false);
                        const statsSource = stats.toJson({ source: true });
                        const settings = statsSource.modules.find((m) => m.name.includes("app-settings.json"));
                        expect(!!settings).toBe(true);
                        expect(JSON.parse(settings.source)).toEqual({ debug: false, apiKey: "123-456", cacheDuration: 5000 });
                        resolve();
                    });
            });
        }));
})