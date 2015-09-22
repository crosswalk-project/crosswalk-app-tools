// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");

var xmldom = require("xmldom");

/**
 * Wrapper for theme.xml.
 * @param {OutputIface} output Output implementation
 * @param {String} path Path to manifest.json
 * @constructor
 */
function XmlTheme(output, path) {

    this._output = output;
    this._path = path;

    var doc = this.read();

    this._fullscreen = false;
    var node = this.findItem(doc, "android:windowFullscreen");
    if (node) {
        this._fullscreen = node.textContent === "true";
    } else {
        this._output.error("Failed to find 'fullscreen' setting in " + this._path);
    }
}

/**
 * Fullscreen mode
 * @member {Boolean} fullscreen
 * @instance
 * @memberOf XmlTheme
 */
Object.defineProperty(XmlTheme.prototype, "fullscreen", {
                      get: function() {
                                return this._fullscreen;
                           },
                      set: function(fullscreen) {
                                this._fullscreen = typeof fullscreen === "boolean" && fullscreen;

                                var doc = this.read();
                                var node = this.findItem(doc, "android:windowFullscreen");
                                if (node) {
                                    node.textContent = this._fullscreen ? "true" : "false";
                                    this.write(doc);
                                } else {
                                    this._output.error("Failed to find 'fullscreen' setting in " + this._path);
                                }
                           }
                      });

/**
 * Read theme.xml
 * @returns {xmldom.Document} XML Document
 * @private
 * @see {@link https://github.com/jindw/xmldom}
 */
XmlTheme.prototype.read =
function() {

    // TODO Error handling

    var parser = new xmldom.DOMParser();
    var buf = FS.readFileSync(this._path, {"encoding": "utf8"});
    return parser.parseFromString(buf);
};

/**
 * Write theme.xml
 * @param {xmldom.Document} doc XML Document
 * @private
 * @see {@link https://github.com/jindw/xmldom}
 */
XmlTheme.prototype.write =
function(doc) {

    // TODO Error handling

    var serializer = new xmldom.XMLSerializer();
    var buf = serializer.serializeToString(doc);
    FS.writeFileSync(this._path, buf);
};

/**
 * Find fullscreen node
 * @param {xmldom.Document} document
 * @returns {xmldom.Node} Node if found or null
 * @private
 */
XmlTheme.prototype.findItem =
function(doc, name) {

    var node = null;

    items = doc.getElementsByTagName("item");
    for (var i = 0; i < items.length; i++) {
        if (items[i].getAttribute("name") === name) {
            return items[i];
        }
    }

    return null;
};

module.exports = XmlTheme;
