// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * Create Application object.
 * @constructor
 * @protected
 */
function Application() {

}

/**
 * Get singleton {@link Config} object.
 * @returns {Config} Config object.
 */
Application.prototype.getConfig =
function() {

    return require("./Config").getInstance();
};

/**
 * Get singleton {@link OutputIface} object.
 * @returns {OutputIface} Output object.
 */
Application.prototype.getOutput =
function() {

    return require("./TerminalOutput").getInstance();
};

module.exports = Application;
