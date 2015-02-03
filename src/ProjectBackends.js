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
function ProjectBackends(application) {

}

/**
 * Load default backend
 * @returns {Function} Constructor for {@link Project} subclass or null.
 * @static
 */
ProjectBackends.prototype.loadDefault =
function() {

    var implementations = [
        "crosswalk-app-tools-backend-ios",
        "crosswalk-app-tools-backend-demo",
        "./android/AndroidProject"
    ];

    var ProjectImpl = null;

    for (var i = 0; i < implementations.length; i++) {

        try {

            ProjectImpl = require(implementations[i]);

            // If we get here there backend has been instantiated successfully.
            Output.log("Using backend " + implementations[i]);
            break;

        } catch (e) {

            Output.log("Loading backend " + implementations[i] + " failed (" + e + ")");
        }
    }

    return ProjectImpl;
};

module.exports = new ProjectBackends();
