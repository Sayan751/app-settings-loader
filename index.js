const fs = require('fs');
const path = require('path');
const { validate } = require('schema-utils');
const { sealedMerge } = require("./sealedMerge");

const loaderName = 'app-settings-loader';
const schema = { env: 'string' };
const defaultOptions = { env: "development" };

function parseFileContent(content, filePath) {
    try {
        return JSON.parse(content);
    } catch (e) {
        throw new Error(`Unable to parse the file ${filePath}; ${loaderName} can only be used to load and transform well-formed json files.`);
    }
}

/**
 * Merges source with envOverride.
 * @param {(err: Error| null, content?: string) => void} source content
 * @param {string} source content
 * @param {string} sourcePath path to the source configuration file
 * @param {string|undefined|null} envOverride content
 * @param {string|undefined|null} envOverridePath path to the environment-specific configuration file
 */
function merge(callback, source, sourcePath, envOverride, envOverridePath) {
    try {
        const sourceConfig = parseFileContent(source, sourcePath);
        const envConfig = envOverridePath != null ? parseFileContent(envOverride, envOverridePath) : {};
        callback(null, JSON.stringify(sealedMerge(sourceConfig, envConfig)));
    } catch (e) {
        callback(e);
    }
}


module.exports = function (source) {
    const callback = this.async();

    const options = Object.assign(defaultOptions, this.getOptions());
    validate(schema, options, loaderName);    

    const ext = path.extname(this.resourcePath);
    const envFile = path.join(path.dirname(this.resourcePath), `${path.basename(this.resourcePath, ext)}.${options.env}${ext}`);
    fs.access(envFile, fs.constants.R_OK, (err) => {
        if (err) {
            merge(callback, source, this.sourcePath);
            return;
        }

        this.addDependency(envFile);
        fs.readFile(envFile, (err, content) => {
            if (err) {
                callback(err);
                return;
            }

            merge(callback, source, this.sourcePath, content, envFile);
        });
    });
};