const mock = require('mock-fs');
const loader = require("../index");

const basePath = "config/app-settings.json",
    prodPath = "config/app-settings.production.json",
    malformedPath = "config/app-settings.malformed.json",
    baseConfig = `{"debug": true, "apiKey": "test", "cacheDuration": 5000}`,
    malformedJson = `malformed json`;

describe("app-settings-loader", () => {
    beforeEach(() => {
        mock({
            [basePath]: baseConfig,
            [prodPath]: `{"debug": false, "apiKey": "123-456"}`,
            [malformedPath]: malformedJson
        });
    });

    afterEach(() => { mock.restore(); });

    it("merges two settings file depending on the environment", () => {
        const context = { resourcePath: basePath, query: { env: "production" } }
        const expected = JSON.parse(`{"debug": false, "apiKey": "123-456", "cacheDuration": 5000}`);
        const actual = JSON.parse(loader.call(context, baseConfig));
        expect(actual).toEqual(expected);
    });

    it("returns base settings if the environment file does not exist", () => {
        const context = { resourcePath: basePath, query: { env: "test" } }
        const expected = JSON.parse(`{"debug": true, "apiKey": "test", "cacheDuration": 5000}`);
        const actual = JSON.parse(loader.call(context, baseConfig));
        expect(actual).toEqual(expected);
    });

    it("throws error if the env json is malformed", () => {
        const context = { resourcePath: basePath, query: { env: "malformed" } }
        try {
            loader.call(context, baseConfig);
        } catch (e) {
            expect(e.message).toEqual(`Unable to parse the file config\\app-settings.malformed.json; app-settings-loader can only be used to load and transform well-formed json files.`);
        }
    });

    it("throws error if the base json is malformed", () => {
        const context = { resourcePath: malformedPath }
        try {
            loader.call(context, malformedJson);
        } catch (e) {
            expect(e.message).toEqual(`Unable to parse the file config/app-settings.malformed.json; app-settings-loader can only be used to load and transform well-formed json files.`);
        }
    });
});