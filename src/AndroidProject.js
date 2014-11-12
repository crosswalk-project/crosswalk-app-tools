// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var AndroidSDK = require("./AndroidSDK");
var Console = require("./Console");
var Project = require("./Project");

/**
 * Android project class.
 * @throws {AndroidSDK~SDKNotFoundError} If the Android SDK was not found in the environment.
 * @constructor
 */
function AndroidProject() {

    this._sdk = new AndroidSDK();
}
AndroidProject.prototype = Project;

/**
 * Implements {Project.generate}
 */
AndroidProject.prototype.generate =
function(packageId, callback) {

    var minApiLevel = 14;
    var apiTarget;
    this._sdk.queryTarget(minApiLevel,
                          function(apiTarget, errormsg) {

        if (!apiTarget || errormsg) {
            Console.error("Error: Failed to find Android SDK target API >= " + minApiLevel + " " +
                          "Try running 'android list targets' to check.");
            callback(1 /* TODO errno */);
        }

        this._sdk.generateProjectTemplate(packageId, apiTarget,
                                          function(path, logMsg, errormsg) {

            if (!path || errormsg) {
                Console.error("Error: Failed to create project template TODO better message");
                callback(1 /* TODO errno */);
            }

            Console.log("Project template created at '" + path + "'");
            callback(0);

        }.bind(this));
    }.bind(this));
};

AndroidProject.prototype.update =
function() {

    // TODO implement
};

AndroidProject.prototype.refresh =
function() {

    // TODO implement
};

AndroidProject.prototype.build =
function() {

    // TODO implement
};

module.exports = AndroidProject;
