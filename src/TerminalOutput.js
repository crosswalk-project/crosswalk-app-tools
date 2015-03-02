// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FiniteProgress = require("./FiniteProgress");
var InfiniteProgress = require("./InfiniteProgress");
var OutputIface = require("./OutputIface");

var _config = require("./Config").getInstance();

/**
 * Creates an output writing to stdout/stderr.
 * @extends OutputIface
 * @constructor
 * @private
 */
function TerminalOutput() {

    if (!TerminalOutput._instance) {
        TerminalOutput._instance = this;
    }

    return TerminalOutput._instance;
}

TerminalOutput.prototype = OutputIface.prototype;

TerminalOutput.prototype.error =
function(message) {

    if (!_config.getSilentConsole())
        console.error("*** ERROR: " + message);
};

TerminalOutput.prototype.warning =
function(message) {

    if (!_config.getSilentConsole())
        console.error(" ** WARNING: " + message);
};

TerminalOutput.prototype.info =
function(message) {

    if (!_config.getSilentConsole())
        console.log("  * " + message);
};

TerminalOutput.prototype.highlight =
function(message) {

    if (!_config.getSilentConsole())
        console.log('\033[1m' + message + '\033[0m');
};

TerminalOutput.prototype.print =
function(message) {

    if (!_config.getSilentConsole())
        console.log(message);
};

/**
 * Output raw string without adding a newline.
 * @param {String} message
 * @param {Boolean} [toStderr] Whether to write on stderr.
 *                             Default is stdout if applicable for the implementation
 */
TerminalOutput.prototype.put =
function(message, stderr) {

    // Default to stdout.
    if (typeof stderr === "undefined")
        stderr = false;

    if (!_config.getSilentConsole()) {
        if (stderr) {
            process.stderr.write(message);
        } else {
            process.stdout.write(message);
        }
    }
};

/**
 * Create progress indicator.
 * @param {String} [label] Descriptive label
 * @returns {FiniteProgress} Progress object.
 */
TerminalOutput.prototype.createFiniteProgress =
function(label) {

    if (typeof label === "undefined")
        label = "";

    // TODO remember the indicator as current context,
    // and when a message (particularly warning or error)
    // is printed while having current context, insert
    // extra newline, so the message is in the correct place.

    var indicator = new FiniteProgress(this, label);
    return indicator;
};

/**
 * Create progress indicator.
 * @param {String} [label] Descriptive label
 * @returns {InfiniteProgress} Progress object.
 */
TerminalOutput.prototype.createInfiniteProgress =
function(label) {

    if (typeof label === "undefined")
        label = "";

    // TODO remember the indicator as current context,
    // and when a message (particularly warning or error)
    // is printed while having current context, insert
    // extra newline, so the message is in the correct place.

    var indicator = new InfiniteProgress(this, label);
    return indicator;
};

/**
 * Retrieve singleton instance.
 * @function getInstance
 * @returns {TerminalOutput} Singleton instance.
 * @memberOf TerminalOutput
 */
function getInstance() {

    return new TerminalOutput();
}

module.exports = {
    class: TerminalOutput,
    getInstance: getInstance
};
