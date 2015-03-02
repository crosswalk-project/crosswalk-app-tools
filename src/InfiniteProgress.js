// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * Progress indicator.
 * @constructor
 * @param {OutputIface} output Output implementation
 * @param {String} label Label text
 */
function InfiniteProgress(output, label) {

    this._output = output;
    this._label = label;
}

/**
 * Update progress indicator.
 * @param {String} tag Tag for current activity
 */
InfiniteProgress.prototype.update =
function(tag) {

    // Clear line
    this._output.put('\033[2K');

    // Go to column 0
    this._output.put('\033[0G');

    var line = "   * " + this._label + " [" + tag + "...]";
    this._output.put(line);
};

/**
 * Final update of progress indicator.
 * @param {String} [message] Completion message to the right of the progress bar.
 */
InfiniteProgress.prototype.done =
function(message) {

    if (typeof message == "undefined")
        message = "";

    // Clear line
    this._output.put('\033[2K');

    // Go to column 0
    this._output.put('\033[0G');

    var line = "   * " + this._label + " [done] " + message;
    this._output.print(line);
};

module.exports = InfiniteProgress;
