// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OutputIface = require("./OutputIface");

var _OUTPUT_TEE_LOGFILE = 0;
var _OUTPUT_TEE_TERMINAL = 1;

/**
 * Console output interface.
 * @constructor
 * @param {OutputIface} logfileOutput
 * @extends OutputIface
 */
function OutputTee(logfileOutput, terminalOutput) {

    this._outputs = [];
    this._outputs[_OUTPUT_TEE_LOGFILE] = logfileOutput;
    this._outputs[_OUTPUT_TEE_TERMINAL] = terminalOutput;
}
OutputTee.prototype = Object.create(OutputIface.prototype);
OutputTee.prototype.constructor = OutputTee;

/**
 * Logfile output.
 * @member {OutputIface} logfileOutput
 * @instance
 * @memberOf OutputTee
 */
Object.defineProperty(OutputTee.prototype, "logfileOutput", {
                      get: function() {
                                return this._outputs[_OUTPUT_TEE_LOGFILE];
                           },
                      set: function(logfileOutput) {
                                this._outputs[_OUTPUT_TEE_LOGFILE] = logfileOutput;
                           }
                      });

/**
 * Terminal output.
 * @member {OutputIface} terminalOutput
 * @instance
 * @memberOf OutputTee
 */
Object.defineProperty(OutputTee.prototype, "terminalOutput", {
                      get: function() {
                                return this._outputs[_OUTPUT_TEE_TERMINAL];
                           },
                      set: function(terminalOutput) {
                                this._outputs[_OUTPUT_TEE_TERMINAL] = terminalOutput;
                           }
                      });

// Implementation of OutputIface.error
OutputTee.prototype.error =
function(message) {

    this._outputs.forEach(function(output) {
        if (output)
            output.error(message);
    });
};

// Implementation of OutputIface.warning
OutputTee.prototype.warning =
function(message) {

    this._outputs.forEach(function(output) {
        if (output)
            output.warning(message);
    });
};

// Implementation of OutputIface.info
OutputTee.prototype.info =
function(message, path) {

    this._outputs.forEach(function(output) {
        if (output)
            output.info(message, path);
    });
};

// Implementation of OutputIface.highlight
OutputTee.prototype.highlight =
function(message) {

    this._outputs.forEach(function(output) {
        if (output)
            output.highlight(message);
    });
};

// Implementation of OutputIface.write
OutputTee.prototype.write =
function(message) {

    this._outputs.forEach(function(output) {
        if (output)
            output.write(message);
    });
};

// Implementation of OutputIface.verbose
OutputTee.prototype.verbose =
function(message) {

    this._outputs.forEach(function(output) {
        if (output)
            output.verbose(message);
    });
};

// TODO implement for logfile output also.
OutputTee.prototype.createFiniteProgress =
function(label) {

    var terminalOutput = this._outputs[_OUTPUT_TEE_TERMINAL];
    return terminalOutput.createFiniteProgress.call(terminalOutput, label);
};

// TODO implement for logfile output also.
OutputTee.prototype.createInfiniteProgress =
function(label) {

    var terminalOutput = this._outputs[_OUTPUT_TEE_TERMINAL];
    return terminalOutput.createInfiniteProgress.call(terminalOutput, label);
};

module.exports = OutputTee;
