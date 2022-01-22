# app-settings-loader

![build status](https://github.com/Sayan751/app-settings-loader/workflows/build/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/Sayan751/app-settings-loader/badge.svg?branch=master)](https://coveralls.io/github/Sayan751/app-settings-loader?branch=master)

[![NPM](https://nodei.co/npm/app-settings-loader.png)](https://nodei.co/npm/app-settings-loader/)

A simple webpack loader to load and customize application settings based on the provided environment.

## Why

We often specify the application settings in a JSON file and use it during development; something like below, for example.

```json
{
    "debug": true,
    "endpoint": "http://localhost:8080/",
    "basePath": "api/"
}
```

However, for production (or any other environment) we may need different settings/values for a subset of keys. For example,

```json
{
    "debug": false,
    "endpoint": "http://my.awesome.service/",
}
```

Using this loader, you can bundle environment specific values, given 2 JSON files exist.

## How

### Install

```bash
npm i -D app-settings-loader
```

### Use

Let us assume that we have following directory structure.

```text
project_root
|
+-config
| |
| +-appConfig.json
| +-appConfig.development.json
|
+-main.ts
+-webpack.config.js
```

Then you use the `appConfig.json` in `main.ts` as follows.

```typescript
// with "resolveJsonModule": true (and "esModuleInterop": true) in your tsconfig
import config from "./config/appConfig.json";

// or
const config = require("./config/appConfig.json");
```

In your webpack add the loader as follows.

```javascript
{
    test: /appConfig\.json$/i, // change this as per your file name
    use: [
        { loader: "app-settings-loader", options: { env: production ? 'production' : 'development' } },
    ]
},
```

With the above config, the loader will merge the customization coming from the `appConfig.development.json` with the base config in `appConfig.json`, when `production` is truthy.

### How does it work

The loader has only one option `env` (environment, default value is `"development"`). If the base JSON file name is `mysettings.json`, it looks for a JSON file named `mysettings.{env}.json` at the same directory path. If there is one, it merges the customization form that file with the base file, and returns the result. In case there is no customization file, it returns the base content. Note that if you want you may have more environment names, as per your need. That is you may set `env` as [`Betelgeuse5`](https://hitchhikers.fandom.com/wiki/Ford_Prefect), and provided you have a  JSON for that, it will load that too :)

#### Note

- **Merging configurations**: The merge operation keeps the schema of the base file intact. That is, no unknown properties or property value of different type, from the customization files can be applied on the base file. This makes sense because during development you expect a certain set of keys and values of certain datatype to be present in your config and you program against this known schema. Therefore any new keys present in the customization file cannot and should not play any part in the source code.
- **Valid JSON**: The content of the both base and customization file needs to be valid JSON. Otherwise, it will throw an error.
- **Do not store sensitive data**: As the config will be part of webpack bundle, you should not store any sensitive data in the customization file. The thumb rule is that any sensitive data that you don't want to keep in your source code, should also not be the part of either base or customization config file.

That's it. If you face any problem, feel free to open an issue.