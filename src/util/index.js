// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * @namespace util
 */
var util = {
    /** {@link CrosswalkZip} */
    CrosswalkDir: require("./CrosswalkDir"),
    /** {@link CrosswalkZip} */
    CrosswalkZip: require("./CrosswalkZip"),
    /** {@link Downloader} */
    Downloader: require("./Downloader"),
    /** {@link Download01Org} */
    Download01Org: require("./Download01Org"),
    /** {@link DownloadHandler} */
    DownloadHandler: require("./DownloadHandler"),
    /** {@link IndexParser} */
    IndexParser: require("./IndexParser"),
    /** {@link Keys} */
    Keys: require("./Keys"),
    /** {@link Targets} */
    Targets: require("./Targets"),
    /** {@link TemplateFile} */
    TemplateFile: require("./TemplateFile"),
    /** {@link Version} */
    Version: require("./Version"),

    /** expose some dependencies for hooks */
    AdmZip: require("adm-zip"),
    FormatJson: require("format-json"),
    NodeUuid: require("uuid"),
    ParseColor: require("parse-color"),
    XmlBuilder: require("xmlbuilder"),
    XmlDom: require("xmldom"),
    ShellJS: require("shelljs"),

    /**
     * Iterate an array with provisions for asynchronous processing of each item.
     * @param {Array} a Array to iterate over
     * @param {Function} callback Function(item, next) to be called for each item.
     *                            Parameter next when called continues iteration.
     * @param {Function} done Function to be called when done iterating.
     */
    iterate: function(a, callback, done) {

        var i = -1;
        function next() {
            i++;
            if (i < a.length) {
                callback(a[i], next);
            } else if (done) {
                done();
            }
        }
        next();
    }
};

module.exports = util;
