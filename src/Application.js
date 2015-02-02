// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Config = require("./Config.js");
var Console = require("./Console.js");

/**
 * Create Application object.
 * @constructor
 * @private
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

    return Config;
};

/**
 * Get singleton {@link Console} object.
 * @function getConsole
 * @returns {@link Console} object
 * @memberOf Application
 */
Application.prototype.getConsole =
function() {

    return Console;
};

module.exports = new Application();
