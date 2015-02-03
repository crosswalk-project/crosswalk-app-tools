// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Config = require("./Config");

/**
 * Progress indicator.
 * @constructor
 * @param {Object} output see {@link OutputIface}
 * @param {String} label Label text
 */
function FiniteProgress(output, label) {

    this._output = output;
    this._label = label;
}

/**
 * Update progress indicator.
 * @param {Number} progress Progress value between 0 and 1.
 */
FiniteProgress.prototype.update =
function(progress) {

    // Clamp
    progress = progress < 0 ? 0 :
               progress > 1 ? 1 :
               progress;


    // Go to column 0
    this._output.put('\033[0G');

    // Label
    this._output.put(this._label);

    // Progress
    this._output.put(" [");
    var percentageInTens = Math.round(progress * 10);
    for (var i = 0; i < percentageInTens; i++) {
        this._output.put('#');
    }

    // Remaining
    for (i = percentageInTens; i < 10; i++) {
        this._output.put(' ');
    }
    this._output.put(']');
};

/**
 * Final update of progress indicator.
 * @param {String} [message] Completion message to the right of the progress bar.
 */
FiniteProgress.prototype.done =
function(message) {

    if (typeof message == "undefined")
        message = "";

    // Also prints \r\n so we're ready for the next output.
    this._output.log(" " + message);
};

module.exports = FiniteProgress;
