// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var TerminalOutput = require("./TerminalOutput.js");

/**
 * Create Application object.
 * @constructor
 * @protected
 */
function Application() {

}

/**
 * Get singleton {@link Config} object.
 * @function getConfig
 * @returns {@link Config} object
 * @memberOf Application
 */
Application.prototype.getConfig =
function() {

    return require("./Config").getInstance();
};

/**
 * Get singleton {@link OutputIface} object.
 * @function getOutput
 * @returns {@link OutputIface} object
 * @memberOf Application
 */
Application.prototype.getOutput =
function() {

    return TerminalOutput;
};

module.exports = Application;
