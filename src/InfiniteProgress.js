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
    this._length = 0;
}

/**
 * Update progress indicator.
 * @function update
 * @param {String} tag Tag for current activity
 * @memberOf InfiniteProgress
 */
InfiniteProgress.prototype.update =
function(tag) {

    // Clear
    if (this._length > 0) {

        // Go to column 0
        this._console.put('\033[0G');

        var a = new Array(this._length, ' ');
        var s = a.join();
        this._console.put(s);
    }

    // Go to column 0
    this._console.put('\033[0G');

    var line = this._label + " [" + tag + "]";
    this._length = line.length;
    this._console.put(line);
};

module.exports = InfiniteProgress;
