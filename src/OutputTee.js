// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var _LOGFILE = 0;
var _TERMINAL = 1;

/**
 * Console output interface.
 * @constructor
 * @param {OutputIface} logfileOutput
 * @extends OutputIface
 */
function OutputTee(logfileOutput, terminalOutput) {

    this._outputs = [];
    this._outputs[_LOGFILE] = logfileOutput;
    this._outputs[_TERMINAL] = terminalOutput;
}

/**
 * Logfile output.
 * @member {OutputIface} logfileOutput
 * @instance
 * @memberOf OutputTee
 */
Object.defineProperty(OutputTee.prototype, "logfileOutput", {
                      get: function() {
                                return this._outputs[_LOGFILE];
                           },
                      set: function(logfileOutput) {
                                this._outputs[_LOGFILE] = logfileOutput;
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
                                return this._outputs[_TERMINAL];
                           },
                      set: function(terminalOutput) {
                                this._outputs[_TERMINAL] = terminalOutput;
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
function(message) {

    this._outputs.forEach(function(output) {
        if (output)
            output.info(message);
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



module.exports = OutputTee;
