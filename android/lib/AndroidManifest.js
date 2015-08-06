// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");

var xmldom = require("xmldom");

/**
 * AndroidManifest wrapper.
 * @param {OutputIface} output Output implementation
 * @param {String} path Path to manifest.json
 * @constructor
 */
function AndroidManifest(output, path) {

    this._output = output;
    this._path = path;

    var doc = this.read();
    this._package = doc.documentElement.getAttribute("package");
    this._versionCode = doc.documentElement.getAttribute("android:versionCode");
    this._versionName = doc.documentElement.getAttribute("android:versionName");

    this._applicationIcon = null;
    var node = this.findApplicationNode(doc);
    if (node) {
        this._applicationIcon = node.getAttribute("android:icon");
    }

    this._applicationLabel = null;
    node = this.findApplicationNode(doc);
    if (node) {
        this._applicationLabel = node.getAttribute("android:label");
    }
}

/**
 * Android package name
 * @member {String} package
 * @instance
 * @memberOf AndroidManifest
 */
Object.defineProperty(AndroidManifest.prototype, "package", {
                      get: function() {
                                return this._package;
                           },
                      });

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
 * Application version a.b.c where a,b < 100, c < 1000
 * @member {String} version
 * @instance
 * @memberOf AndroidManifest
 */
Object.defineProperty(AndroidManifest.prototype, "versionName", {
                      get: function() {
                                return this._versionName;
                           },
                      set: function(versionName) {
                                this._versionName = versionName;

                                var doc = this.read();
                                doc.documentElement.setAttribute("android:versionName", versionName);
                                this.write(doc);
                           }
                      });

/**
 * Application icon
 * @member {String} applicationIcon Value for <application android:icon= in the android manifest
 * @instance
 * @memberOf AndroidManifest
 */
Object.defineProperty(AndroidManifest.prototype, "applicationIcon", {
                      get: function() {
                                return this._applicationIcon;
                           },
                      set: function(applicationIcon) {
                                // Look up <application> node
                                var doc = this.read();
                                var node = this.findApplicationNode(doc);
                                // Test and set
                                if (node) {
                                    this._applicationIcon = applicationIcon;
                                    node.setAttribute("android:icon", applicationIcon);
                                    this.write(doc);
                                } else {
                                    this._output.warning("Did not find <application> element in AndroidManifest.xml");
                                }
                           }
                      });

/**
 * Application label
 * @member {String} applicationLabel Value for <application android:label= in the android manifest
 * @instance
 * @memberOf AndroidManifest
 */
Object.defineProperty(AndroidManifest.prototype, "applicationLabel", {
                      get: function() {
                                return this._applicationLabel;
                           },
                      set: function(applicationLabel) {
                                // Look up <application> node
                                var doc = this.read();
                                var node = this.findApplicationNode(doc);
                                // Test and set
                                if (node) {
                                    if (node.getAttribute("android:label")[0] === '@') {
                                        this._output.warning("Field 'android:label' appears to be localised, please update manually");
                                    } else {
                                        this._applicationLabel = applicationLabel;
                                        node.setAttribute("android:label", applicationLabel);
                                        this.write(doc);
                                    }
                                } else {
                                    this._output.warning("Did not find <application> element in AndroidManifest.xml");
                                }
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

/**
 * Find application node
 * @param {xmldom.Document} document
 * @returns {xmldom.Node} Node if found or null
 * @private
 */
AndroidManifest.prototype.findApplicationNode =
function(document) {

    var node = null;

    for (var idx in document.documentElement.childNodes) {
        var n = document.documentElement.childNodes[idx];
        if (n.nodeName === "application") {
            node = n;
            break;
        }
    }

    return node;
};

module.exports = AndroidManifest;
