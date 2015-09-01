// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var PlatformInfo = require("./PlatformInfo");

/**
 * Class that manages platform backends.
 * @constructor
 * @param {OutputIface} Output instance
 */
function PlatformsManager(output) {

    this._output = output;
}

PlatformsManager._implementations = {
    "ios": "crosswalk-app-tools-backend-ios",
    "deb": "crosswalk-app-tools-backend-deb",
    "demo": "crosswalk-app-tools-backend-demo",
    "test": "crosswalk-app-tools-backend-test",
    "android": "../android/index.js",
    "windows": "../windows/index.js"
};

/**
 * Load default backend.
 * @returns {PlatformInfo} Metadata object for loaded platform.
 */
PlatformsManager.prototype.loadDefault =
function() {

    function silentCb(errormsg) {}

    var output = this._output;

    var platformInfo = null;
    var warnings = [];

    for (var platformId in PlatformsManager._implementations) {

        // Silent error callback because we just try loading all.
        platformInfo = this.load(platformId, silentCb);
        if (platformInfo) {
            break;
        } else {
            // Accumulate warnings, only emit them if no backend was found.
            warnings.push("Loading platform '" + platformId + "' failed");
        }
    }

    if (!platformInfo) {
        for (var j = 0; j < warnings.length; j++) {
            output.warning(warnings[j]);
        }
    }

    return platformInfo;
};

/**
 * Load all installed backends.
 * @returns {PlatformInfo} Metadata object for loaded platform.
 */
PlatformsManager.prototype.loadAll =
function() {

    function silentCb(errormsg) {}

    var output = this._output;

    var backends = [];

    for (var platformId in PlatformsManager._implementations) {

        // Silent error callback because we just try loading all.
        platformInfo = this.load(platformId, silentCb);
        if (platformInfo) {
            backends.push(platformInfo);
        }
    }

    return backends;
};

/**
 * Load backend by name.
 * @param {String} platformId Unique platform name
 * @param {Function} callback Callback carrying error message on failure
 * @returns {PlatformInfo} Metadata object or null if platform could not be loaded.
 */
PlatformsManager.prototype.load =
function(platformId, callback) {

    var output = this._output;

    var platformInfo = null;

    try {

        var moduleName = PlatformsManager._implementations[platformId];
        var Ctor = require(moduleName);
        platformInfo = new PlatformInfo(Ctor, platformId);

    } catch (e) {

        if (callback)
            callback(e.message);
        else
            output.error(e.message);
        return null;
    }

    return platformInfo;
};

module.exports = PlatformsManager;
