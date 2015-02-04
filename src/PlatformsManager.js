// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Config = require("./Config");

/**
 * Class that manages platform backends
 * @constructor
 * @param {Application} application instance
 * @private
 */
function PlatformsManager(application) {

    this._application = application;
}

/**
 * Load default backend
 * @returns {PlatformIface} Constructor for {@link PlatformIface} subclass or null.
 */
PlatformsManager.prototype.loadDefault =
function() {

    var output = this._application.getOutput();

    var implementations = [
        "crosswalk-app-tools-backend-ios",
        "crosswalk-app-tools-backend-demo",
        "./android/AndroidPlatform"
    ];

    var PlatformImpl = null;

    for (var i = 0; i < implementations.length; i++) {

        try {

            PlatformImpl = require(implementations[i]);

            // If we get here there backend has been instantiated successfully.
            output.log("Using backend " + implementations[i]);
            break;

        } catch (e) {

            output.log("Loading backend " + implementations[i] + " failed (" + e + ")");
        }
    }

    return PlatformImpl;
};

module.exports = PlatformsManager;
