// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");

/**
 * Manifest wrapper.
 * @param {OutputIface} output Output implementation
 * @param {String} path Path to manifest.json
 */
function Manifest(output, path) {

    var buffer = FS.readFileSync(path, {"encoding": "utf8"});
    var json = JSON.parse(buffer);

    this._appVersion = "1";
    if (json.crosswalk_app_version &&
        json.crosswalk_app_version.match("^([0-9]+\.){0,2}[0-9]+$")) {
        this._appVersion = json.crosswalk_app_version;
    } else {
        output.error("Invalid app version '" + json.crosswalk_app_version + "' in the manifest");
    }
}

/**
 * Application version a.b.c where a,b < 100, c < 1000
 * @member {String} version
 * @instance
 * @memberOf Manifest
 */
Object.defineProperty(Manifest.prototype, "appVersion", {
                      get: function() {
                                return this._appVersion;
                           }
                      });

module.exports = Manifest;
