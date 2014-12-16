// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Config = require("./Config");
var ConsoleIface = require("./ConsoleIface");
var FiniteProgress = require("./FiniteProgress");
var InfiniteProgress = require("./InfiniteProgress");

/**
 * Creates a logging console.
 * @constructor
 */
function StdioConsole() {}

StdioConsole.prototype = ConsoleIface.prototype;

StdioConsole.prototype.error =
function(message) {

    if (!Config.getSilentConsole())
        console.error("ERROR: " + message);
};

StdioConsole.prototype.log =
function(message) {

    if (!Config.getSilentConsole())
        console.log(message);
};

StdioConsole.prototype.highlight =
function(message) {

    if (!Config.getSilentConsole())
        console.log('\033[1m' + message + '\033[0m');
};

StdioConsole.prototype.put =
function(message, stderr) {

    // Default to stdout.
    if (typeof stderr === "undefined")
        stderr = false;

    if (!Config.getSilentConsole()) {
        if (stderr) {
            process.stderr.write(message);
        } else {
            process.stdout.write(message);
        }
    }
};

StdioConsole.prototype.createFiniteProgress =
function(label) {

    var indicator = new FiniteProgress(this, label);
    return indicator;
};

StdioConsole.prototype.createInfiniteProgress =
function(label) {

    var indicator = new InfiniteProgress(this, label);
    return indicator;
};



/**
 * Creates a silent console.
 * @constructor
 */
/*
function SilentConsole() {}

SilentConsole.prototype = ConsoleIface.prototype;

SilentConsole.prototype.error = function(message) {};

SilentConsole.prototype.warning = function(message) {};

SilentConsole.prototype.log = function(message) {};
*/


module.exports = new StdioConsole();
