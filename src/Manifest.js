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

    // App version is [major.][minor.]micro
    // Major and minor need to be < 100, micro < 1000
    if (json.crosswalk_app_version &&
        json.crosswalk_app_version.match("^([0-9]+\.){0,2}[0-9]+$")) {

        var valid = true;
        var numbers = json.crosswalk_app_version.split(".");
        for (var i = 0; i < numbers.length; i++) {
            if (i == numbers.length - 1 &&
                numbers[i] >= 1000) {
                // Last component, up to 3 digits
                output.warning("App version part '" + numbers[i] + "' must be < 1000");
                valid = false;
                break;
            } else if (i < numbers.length - 1 &&
                       numbers[i] >= 100) {
                // First 2 components, up to 2 digits
                output.warning("App version part '" + numbers[i] + "' must be < 100");
                valid = false;
                break;
            }
        }

        if (valid) {
            this._appVersion = json.crosswalk_app_version;
        }
    }

    if (!this._appVersion) {
        output.error("Invalid app version '" + json.crosswalk_app_version + "' in the manifest");
        // TODO maybe exception
    }
}

/**
 * Create manifest at project creation stage.
 * @param {OutputIface} output Output implementation
 * @param {String} path Path to manifest.json
 * @returns {Manifest} Loaded manifest instance.
 * @memberOf Manifest
 * @static
 */
Manifest.create =
function(path) {

    var buffer = JSON.stringify({
        "crosswalk_app_version": "1"
    });
    FS.writeFileSync(path, buffer);
};

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
