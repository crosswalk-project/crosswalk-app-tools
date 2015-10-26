// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Os = require("os");

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

    this._progress = null;

    return TerminalOutput._instance;
}
TerminalOutput.prototype = Object.create(OutputIface.prototype);
TerminalOutput.prototype.constructor = TerminalOutput;

TerminalOutput.prototype.error =
function(message) {

    if (!_config.getSilentConsole()) {
        if (this._progress &&
            this._progress.isActive) {
            console.log("");
        }
        console.error("*** ERROR: " + message);
    }
};

TerminalOutput.prototype.warning =
function(message) {

    if (!_config.getSilentConsole()) {
        if (this._progress &&
            this._progress.isActive) {
            console.log("");
        }
        console.error(" ** WARNING: " + message);
    }
};

TerminalOutput.prototype.info =
function(message) {

    if (!_config.getSilentConsole()) {
        if (this._progress &&
            this._progress.isActive) {
            console.log("");
        }
        console.log("  * " + message);
    }
};

TerminalOutput.prototype.highlight =
function(message) {

    if (!_config.getSilentConsole()) {
        if (this._progress &&
            this._progress.isActive) {
            console.log("");
        }
        console.log('\033[1m' + message + '\033[0m');
    }
};

TerminalOutput.prototype.write =
function(message) {

    if (!_config.getSilentConsole()) {
        process.stdout.write(message);
    }
};

TerminalOutput.prototype.verbose =
function(message) {

    // Not printed by default.
    // FIXME maybe make this configurable
    // through verbosity or something.
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

    this._progress = new FiniteProgress(this, label);
    return this._progress;
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

    this._progress = new InfiniteProgress(this, label);
    return this._progress;
};

/**
 * End progress display and switch back to line mode.
 * Only to be called from the progress indicator classes.
 * @private
 */
TerminalOutput.prototype.endProgress =
function() {

    this._progress = null;
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
