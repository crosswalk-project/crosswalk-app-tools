// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Config = require("./Config");

/**
 * Progress indicator.
 * @constructor
 * @param {Object} console see {@link Console}
 * @param {String} label Label text
 */
function FiniteProgress(console, label) {

    this._console = console;
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
    this._console.put('\033[0G');

    // Label
    this._console.put(this._label);

    // Progress
    this._console.put(" [");
    var percentageInTens = Math.round(progress * 10);
    for (var i = 0; i < percentageInTens; i++) {
        this._console.put('#');
    }

    // Remaining
    for (i = percentageInTens; i < 10; i++) {
        this._console.put(' ');
    }
    this._console.put(']');
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
    this._console.log(" " + message);
};

module.exports = FiniteProgress;
