// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Console = require("../src/Console");
var ShellJS = require("shelljs");

/**
 * Create AndroidSDK object, wrapping Android cmd-line tool interactions.
 * @constructor
 */
function AndroidSDK() {}

/**
 * Check whether the Android SDK is available.
 * @returns {Boolean} true if available, otherwise false.
 * @memberOf AndroidSDK
 */
AndroidSDK.prototype.isAvailable = function() {

    var path = ShellJS.which("android");

    return typeof path == "string";
};

AndroidSDK.prototype.getTargets = function() {

    // TODO
};

AndroidSDK.prototype.generateProject = function() {

    // TODO
};

AndroidSDK.prototype.refreshProject = function() {

    // TODO
};

AndroidSDK.prototype.buildProject = function() {

    // TODO
};

module.exports = AndroidSDK;
