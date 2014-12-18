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
function InfiniteProgress(console, label) {

    this._console = console;
    this._label = label;
}

/**
 * Update progress indicator.
 * @function update
 * @param {String} tag Tag for current activity
 * @memberOf InfiniteProgress
 */
InfiniteProgress.prototype.update =
function(tag) {

    // Clear line
    this._console.put('\033[2K');

    // Go to column 0
    this._console.put('\033[0G');

    var line = this._label + " [" + tag + ']';
    this._console.put(line);
};

/**
 * Final update of progress indicator.
 * @function done
 * @param {String} [message] Completion message to the right of the progress bar.
 * @memberOf InfiniteProgress
 */
InfiniteProgress.prototype.done =
function(message) {

    if (typeof message == "undefined")
        message = "";

    // Also prints \r\n so we're ready for the next output.
    this._console.log(" " + message);
};

module.exports = InfiniteProgress;
