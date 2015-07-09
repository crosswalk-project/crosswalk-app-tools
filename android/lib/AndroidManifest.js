// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");

var xmldom = require("xmldom");

/**
 * AndroidManifest wrapper.
 * @param {OutputIface} output Output implementation
 * @param {String} path Path to manifest.json
 */
function AndroidManifest(output, path) {

    this._output = output;
    this._path = path;

    var doc = this.read();
    this._versionCode = doc.documentElement.getAttribute("android:versionCode");
}

/**
 * Application version a.b.c where a,b < 100, c < 1000
 * @member {String} version
 * @instance
 * @memberOf AndroidManifest
 */
Object.defineProperty(AndroidManifest.prototype, "versionCode", {
                      get: function() {
                                return this._versionCode;
                           },
                      set: function(versionCode) {
                                this._versionCode = versionCode;

                                var doc = this.read();
                                doc.documentElement.setAttribute("android:versionCode", versionCode);
                                this.write(doc);
                           }
                      });

/**
 * Read AndroidManifest.xml
 * @returns {xmldom.Document} XML Document
 * @protected
 * @see {@link https://github.com/jindw/xmldom}
 */
AndroidManifest.prototype.read =
function() {

    var parser = new xmldom.DOMParser();
    var buf = FS.readFileSync(this._path, {"encoding": "utf8"});
    return parser.parseFromString(buf);
};

/**
 * Write AndroidManifest.xml
 * @param {xmldom.Document} doc XML Document
 * @protected
 * @see {@link https://github.com/jindw/xmldom}
 */
AndroidManifest.prototype.write =
function(doc) {

    var serializer = new xmldom.XMLSerializer();
    var buf = serializer.serializeToString(doc);
    FS.writeFileSync(this._path, buf);
};

module.exports = AndroidManifest;
