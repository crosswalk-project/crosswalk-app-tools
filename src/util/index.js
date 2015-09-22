// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * @namespace util
 */
var util = {
    /** {@link CrosswalkZip} */
    CrosswalkZip: require("./CrosswalkZip"),
    /** {@link Downloader} */
    Downloader: require("./Downloader"),
    /** {@link DownloadHandler} */
    DownloadHandler: require("./DownloadHandler"),
    /** {@link IndexParser} */
    IndexParser: require("./IndexParser"),
    /** {@link TemplateFile} */
    TemplateFile: require("./TemplateFile"),

    /**
     * Iterate an array with provisions for asynchronous processing of each item.
     * @param {Array} a Array to iterate over
     * @param {Function} callback Function(item, next) to be called for each item.
     *                            Parameter next when called continues iteration.
     * @param {Function} done Function to be called when done iterating.
     */
    iterate: function(a, callback, done) {

        if (a instanceof Array && a.length === 0) {
            return;
        }

        var i = -1;

        function next() {

            i++;
            if (i < a.length) {
                callback(a[i], next);
            } else {
                done();
            }
        }

        next();
    }
};

module.exports = util;
