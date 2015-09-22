// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * Progress indicator.
 * @constructor
 * @param {OutputIface} output Output implementation
 * @param {String} label Label text
 */
function FiniteProgress(output, label) {

    this._output = output;
    this._label = label;
    this._active = false;
}

/**
 * Whether the indicator has already been activated (first update() call)
 * @member {Boolean} isActive
 * @instance
 * @memberOf FiniteProgress
 */
Object.defineProperty(FiniteProgress.prototype, "isActive", {
                      get: function() {
                                return this._active;
                           }
                      });

/**
 * Update progress indicator.
 * @param {Number} progress Progress value between 0.0 and 1.0
 */
FiniteProgress.prototype.update =
function(progress) {

    this._active = true;

    // Clamp
    progress = progress < 0 ? 0 :
               progress > 1 ? 1 :
               progress;

    // Go to column 0
    this._output.write('\033[0G');

    // Label
    this._output.write("  * " + this._label);

    // Progress
    this._output.write(" [");
    var percentageInTens = Math.round(progress * 10);
    for (var i = 0; i < percentageInTens; i++) {
        this._output.write('#');
    }

    // Remaining
    for (i = percentageInTens; i < 10; i++) {
        this._output.write(' ');
    }
    this._output.write(']');
};

/**
 * Final update of progress indicator.
 * @param {String} [message] Completion message to the right of the progress bar
 */
FiniteProgress.prototype.done =
function(message) {

    if (typeof message == "undefined")
        message = "";

    // Also prints \r\n so we're ready for the next output.
    this._output.write(" " + message + "\n");

    this._output.endProgress();
    this._active = false;
};

module.exports = FiniteProgress;
