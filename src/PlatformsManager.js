// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * Class that manages platform backends.
 * @constructor
 * @param {Application} Application instance
 * @private
 */
function PlatformsManager(application) {

    this._application = application;
}

/**
 * @typedef PlatformInfo
 * @type {Object}
 * @property {Function} Ctor Constructor for the associated {@link PlatformBase} subclass
 * @property {String} platformId Name for backend (android, ios, ...)
 * @memberOf PlatformsManager
 */

/**
 * Load default backend.
 * @returns {PlatformInfo} Metadata object for loaded platform.
 */
PlatformsManager.prototype.loadDefault =
function() {

    var output = this._application.output;

    var implementations = [
        "crosswalk-app-tools-backend-ios",
        "crosswalk-app-tools-backend-deb",
        "crosswalk-app-tools-backend-demo",
        "./android/AndroidPlatform"
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
            } else if (implementations[i] == "./android/AndroidPlatform") {
                // Special case built-in android backend, so we get a conforming name.
                platformId = "android";
            } else {
                throw new Error("Unhandled platform name " + implementations[i]);
            }
            platformInfo = {
                Ctor: Ctor,
                platformId: platformId
            };

            // If we get here there backend has been instantiated successfully.
            output.info("Using backend '" + platformId + "'");
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
