// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var ConsoleIface = require("./ConsoleIface");

/**
 * Creates a logging console.
 * @constructor
 */
function StdioConsole() {}

StdioConsole.prototype = ConsoleIface.prototype;

StdioConsole.prototype.error = function(message) {

    console.error("ERROR: " + message);
};

StdioConsole.prototype.warning = function(message) {

    console.error("WARNING: " + message);
};

module.exports = new StdioConsole();
