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

PlatformsManager._implementations = [
    "crosswalk-app-tools-backend-ios",
    "crosswalk-app-tools-backend-deb",
    "crosswalk-app-tools-backend-demo",
    "crosswalk-app-tools-backend-test",
    "../android/index.js"
];

/**
 * Load default backend.
 * @returns {PlatformInfo} Metadata object for loaded platform.
 */
PlatformsManager.prototype.loadDefault =
function() {

    var output = this._output;

    var platformInfo = null;
    var warnings = [];

    for (var i = 0; i < PlatformsManager._implementations.length; i++) {

        platformInfo = this.load(PlatformsManager._implementations[i]);

        if (platformInfo) {

            break;

        } else {
            // Accumulate warnings, only emit them if no backend was found.
            warnings.push("Loading backend " + PlatformsManager._implementations[i] + " failed");
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
 * Load default backend.
 * @returns {PlatformInfo} Metadata object for loaded platform.
 */
PlatformsManager.prototype.loadAll =
function() {

    var output = this._output;

    var backends = [];

    for (var i = 0; i < PlatformsManager._implementations.length; i++) {

        platformInfo = this.load(PlatformsManager._implementations[i]);
        if (platformInfo) {
            backends.push(platformInfo);
        }
    }

    return backends;
};

/**
 * Load backend by name.
 * @returns {PlatformInfo} Metadata object or null if platform could not be loaded.
 */
PlatformsManager.prototype.load =
function(name) {

    var platformInfo = null;

    try {

        var Ctor = require(name);
        var prefix = "crosswalk-app-tools-backend-";
        var platformId = null;
        if (name.substring(0, prefix.length) == prefix) {
            // Extract last part after common prefix.
            platformId = name.substring(prefix.length);
        } else if (name == "../android/index.js") {
            // Special case built-in android backend, so we get a conforming name.
            platformId = "android";
        } else {
            throw new Error("Unhandled platform name " + name);
        }

        platformInfo = new PlatformInfo(Ctor, platformId);

    } catch (e) {

        // Ignore because we have a hardcoded list of platforms and not all
        // will be available.
    }

    return platformInfo;
};

module.exports = PlatformsManager;
