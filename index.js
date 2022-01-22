const fs = require('fs');
const path = require('path');
const { validate } = require('schema-utils');
const { sealedMerge } = require("./sealedMerge");

const loaderName = 'app-settings-loader';
const schema = { env: 'string' };
const defaultOptions = { env: "development" };

const parseFileContent = (content, filePath) => {
    try {
        return JSON.parse(content);
    } catch (e) {
        throw new Error(`Unable to parse the file ${filePath}; ${loaderName} can only be used to load and transform well-formed json files.`);
    }
}

module.exports = function (source) {
    const options = Object.assign(defaultOptions, this.getOptions());
    validate(schema, options, loaderName);

    const ext = path.extname(this.resourcePath);
    const envFile = path.join(path.dirname(this.resourcePath), `${path.basename(this.resourcePath, ext)}.${options.env}${ext}`);
    let envConfig = {};

    if (fs.existsSync(envFile)) {
        envConfig = parseFileContent(fs.readFileSync(envFile), envFile);
    }
    const sourceConfig = parseFileContent(source, this.resourcePath);

    return JSON.stringify(sealedMerge(sourceConfig, envConfig));
};