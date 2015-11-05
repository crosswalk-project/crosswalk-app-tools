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
    this._active = false;
    this._prefix = this._output.prefix;
}

/**
 * Whether the indicator has already been activated (first update() call)
 * @member {Boolean} isActive
 * @instance
 * @memberOf InfiniteProgress
 */
Object.defineProperty(InfiniteProgress.prototype, "isActive", {
                      get: function() {
                                return this._active;
                           },
                      set: function(active) {
                                this._active = active ? true : false;
                           }
                      });

/**
 * Update progress indicator.
 * @param {String} tag Tag for current activity
 */
InfiniteProgress.prototype.update =
function(tag) {

    this._active = true;

    // Clear line
    this._output.write('\033[2K');

    // Go to column 0
    this._output.write('\033[0G');

    var line = this._prefix + this._label + " [" + tag + "...]";
    this._output.write(line);
};

/**
 * Final update of progress indicator.
 * @param {String} [message] Completion message to the right of the progress bar.
 */
InfiniteProgress.prototype.done =
function(message) {

    if (this._active) {
        if (typeof message == "undefined")
            message = "";

        // Clear line
        this._output.write('\033[2K');

        // Go to column 0
        this._output.write('\033[0G');

        var line = this._prefix + this._label + " [done] " + message + "\n";
        this._output.write(line);

        this._output.endProgress();
        this._active = false;
    }
};

module.exports = InfiniteProgress;
