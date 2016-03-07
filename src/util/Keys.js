// Copyright © 2016 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var OS = require("os");
var Path = require('path');

var ShellJS = require("shelljs");

/**
 * @constructor
 * @private
 */
function Keys() {

}

/**
 * Retrieve configured google api keys.
 * @param {String} name Name for the set of keys
 * @returns {Object}
 * @throws {Error} If the keys file could not be read.
 */
Keys.getGoogleApiKeys =
function(name) {

    var path;

    // Allow absolute path be passed for testing.
    // This is undocumented.
// FIXME    if (Path.isAbsolute(name)) {
    if (name[0] === "/" || name[1] === ":") {
        path = name;
        // Set of keys must be under same name as filename;
        name = Path.basename(name);
    } else {
        if (OS.homedir) {
            path = Path.join(OS.homedir(), ".crosswalk-app-tools-keys.json");
        } else {
            path = Path.join(process.env.HOME, ".crosswalk-app-tools-keys.json");
        }
    }

    if (!ShellJS.test("-f", path)) {
        throw new Error("File not found " + path);
    }

    var buf = FS.readFileSync(path, {"encoding": "utf8"});
    if (!buf) {
        throw new Error("Could not read " + path);
    }

    var json = JSON.parse(buf);
    if (!json) {
        throw new Error("Could not parse " + path);
    }

    var googleKeys = json[name] ? json[name].google : null;
    if (!googleKeys) {
        throw new Error("Google API keys not found for '" + name + "' in " + path);
    }

    if (!(googleKeys.GOOGLE_API_KEY &&
          googleKeys.GOOGLE_DEFAULT_CLIENT_ID &&
          googleKeys.GOOGLE_DEFAULT_CLIENT_SECRET)) {

        throw new Error("Malformed Google API keys for '" + name + "' in " + path);
    }

    return googleKeys;
};

module.exports = Keys;
