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
    var appNode = this.findApplicationNode(doc);
    if (appNode) {
        this._applicationIcon = appNode.getAttribute("android:icon");
    }

    this._applicationLabel = null;
    appNode = this.findApplicationNode(doc);
    if (appNode) {
        this._applicationLabel = appNode.getAttribute("android:label");
    }

    var activityNode = this.findChildNode(appNode, "activity");
    if (activityNode) {
        this._screenOrientation = activityNode.getAttribute("android:screenOrientation");
    }

    // TODO read other values from manifest and initialize members
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
                                        // Also set name on the activity
                                        var activityNode = this.findChildNode(node, "activity");
                                        if (activityNode)
                                            activityNode.setAttribute("android:label", applicationLabel);
                                        // Save
                                        this.write(doc);
                                    }
                                } else {
                                    this._output.warning("Did not find <application> element in AndroidManifest.xml");
                                }
                           }
                      });

/**
 * Orientation
 * @member {String} screenOrientation Value for <activity android:screenOrientation= in the android manifest
 * @instance
 * @memberOf AndroidManifest
 */
Object.defineProperty(AndroidManifest.prototype, "screenOrientation", {
                      get: function() {
                                return this._screenOrientation;
                           },
                      set: function(orientation) {

                                // Check
                                var values = ["unspecified", "behind",
                                              "landscape", "portrait",
                                              "reverseLandscape", "reversePortrait",
                                              "sensorLandscape", "sensorPortrait",
                                              "userLandscape", "userPortrait",
                                              "sensor", "fullSensor", "nosensor",
                                              "user", "fullUser", "locked"];
                                if (values.indexOf(orientation) < 0) {
                                    this._output.warning("Invalid screenOrientation: " + orientation);
                                    return;
                                }

                                // Look up <application> node
                                var doc = this.read();
                                var node = this.findApplicationNode(doc);
                                if (node) {
                                    var activityNode = this.findChildNode(node, "activity");
                                    if (activityNode) {
                                        activityNode.setAttribute("android:screenOrientation", orientation);
                                        this._screenOrientation = orientation;
                                    } else {
                                        this._output.warning("Did not find <activity> element in AndroidManifest.xml");
                                    }
                                    // Save
                                    this.write(doc);
                                } else {
                                    this._output.warning("Did not find <application> element in AndroidManifest.xml");
                                }
                           }
                      });

/**
 * Permissions
 * @member {Array} permissions Android permissisons
 * @instance
 * @memberOf AndroidManifest
 */
Object.defineProperty(AndroidManifest.prototype, "permissions", {
                      get: function() {

                                var permissions = [];
                                var doc = this.read();
                                for (var idx in doc.documentElement.childNodes) {
                                    var n = doc.documentElement.childNodes[idx];
                                    if (n.nodeName === "uses-permission") {
                                        var value = n.getAttribute("android:name");
                                        // e.g. android.permissions.CAMERA, index 2 is actual value
                                        var suffix = value.split(".")[2];
                                        permissions.push(suffix);
                                    }
                                }
                                return permissions;
                           },
                      set: function(permissions) {

                                if (!(permissions instanceof Array)) {
                                    this._output.warning("Invalid permissions: " + permissions);
                                    return;
                                }

                                var doc = this.read();

                                // Remove permissions
                                var child;
                                var permNodes = doc.getElementsByTagName("uses-permission");
                                for (var i = 0; permNodes[i]; i++) {
                                    child = permNodes[i];
                                    doc.documentElement.removeChild(child);
                                }

                                // Add new permissions
                                this._output.info("Adding permissions " + permissions.join(","));
                                permissions.forEach(function (permission) {
                                    child = doc.createElement("uses-permission");
                                    if (permission.indexOf(".") < 0) {
                                        // If permission is not namespaced, use Android namespace
                                        child.setAttribute("android:name", "android.permission." + permission);
                                    } else {
                                        child.setAttribute("android:name", permission);
                                    }
                                    doc.documentElement.appendChild(child);
                                });

                                this.write(doc);
                           }
                      });

/**
 * activityClassName
 * @member {String} activityClassName Name for main activity java class
 * @instance
 * @memberOf AndroidManifest
 */
Object.defineProperty(AndroidManifest.prototype, "activityClassName", {
                      get: function() {
                                var doc = this.read();
                                var node = this.findApplicationNode(doc);
                                if (node) {
                                    var activityNode = this.findChildNode(node, "activity");
                                    if (activityNode) {
                                        var androidName = activityNode.getAttribute("android:name");
                                        // Remove leading .
                                        return androidName.split(".").pop();
                                    } else {
                                        this._output.warning("Did not find <activity> element in AndroidManifest.xml");
                                    }
                                } else {
                                    this._output.warning("Did not find <application> element in AndroidManifest.xml");
                                }
                                return null;
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

/**
 * Find named child node
 * @param {xmldom.Node} node
 * @param {String} name Child name
 * @returns {xmldom.Node} Node if found or null
 * @private
 */
AndroidManifest.prototype.findChildNode =
function(node, name) {

    var child = null;

    for (var idx in node.childNodes) {
        child = node.childNodes[idx];
        if (child.nodeName === name) {
            return child;
        }
    }

    return null;
};

module.exports = AndroidManifest;
