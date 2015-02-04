// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Config = require("./Config");
var Output = require("./Application").getOutput();

/**
 * Class that manages platform backends
 * @constructor
 * @private
 */
function PlatformsManager(application) {

}

/**
 * Load default backend
 * @returns {Function} Constructor for {@link PlatformIface} subclass or null.
 * @static
 */
PlatformsManager.prototype.loadDefault =
function() {

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
            Output.log("Using backend " + implementations[i]);
            break;

        } catch (e) {

            Output.log("Loading backend " + implementations[i] + " failed (" + e + ")");
        }
    }

    return PlatformImpl;
};

module.exports = new PlatformsManager();
