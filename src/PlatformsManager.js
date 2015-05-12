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

/**
 * Load default backend.
 * @returns {PlatformInfo} Metadata object for loaded platform.
 */
PlatformsManager.prototype.loadDefault =
function() {

    var output = this._output;

    var implementations = [
        "crosswalk-app-tools-backend-ios",
        "crosswalk-app-tools-backend-deb",
        "crosswalk-app-tools-backend-demo",
        "crosswalk-app-tools-backend-test",
        "../android/index.js"
    ];

    var platformInfo = null;
    var warnings = [];

    for (var i = 0; i < implementations.length; i++) {

        try {

            var Ctor = require(implementations[i]);
            var prefix = "crosswalk-app-tools-backend-";
            var platformId = null;
            if (implementations[i].substring(0, prefix.length) == prefix) {
                // Extract last part after common prefix.
                platformId = implementations[i].substring(prefix.length);
            } else if (implementations[i] == "../android/index.js") {
                // Special case built-in android backend, so we get a conforming name.
                platformId = "android";
            } else {
                throw new Error("Unhandled platform name " + implementations[i]);
            }

            platformInfo = new PlatformInfo(Ctor, platformId);

            // If we get here there backend has been instantiated successfully.
            break;

        } catch (e) {

            // Accumulate warnings, only emit them if no backend was found.
            warnings.push("Loading backend " + implementations[i] + " failed (" + e + ")");
        }
    }

    if (!platformInfo) {
        for (var j = 0; j < warnings.length; j++) {
            output.warning(warnings[j]);
        }
    }

    return platformInfo;
};

module.exports = PlatformsManager;
