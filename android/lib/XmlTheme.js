// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Path = require("path");

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
}

/**
 * Window background
 * @member {String} background Drawable name
 * @instance
 * @memberOf XmlTheme
 */
Object.defineProperty(XmlTheme.prototype, "background", {
                      get: function() {
                                var doc = this.read();
                                var node = this.findItem(doc, "android:windowBackground");
                                var background = "";
                                if (node) {
                                    background = node.textContent;
                                } else {
                                    this._output.error("Failed to find 'android:windowBackground' setting in " + this._path);
                                }
                                return background;
                           },
                      set: function(background) {
                                if (typeof background != "string") {
                                    this._output.error("Background must be string value for " + this._path);
                                }
                                var doc = this.read();
                                var node = this.findItem(doc, "android:windowBackground");
                                if (node) {
                                    node.textContent = background;
                                    this.write(doc);
                                } else {
                                    this._output.error("Failed to find 'android:windowBackground' setting in " + this._path);
                                }
                           }
                      });

/**
 * Fullscreen mode
 * @member {Boolean} fullscreen
 * @instance
 * @memberOf XmlTheme
 */
Object.defineProperty(XmlTheme.prototype, "fullscreen", {
                      get: function() {
                                var doc = this.read();
                                var node = this.findItem(doc, "android:windowFullscreen");
                                var fullscreen = false;
                                if (node) {
                                    fullscreen = node.textContent === "true";
                                } else {
                                    this._output.error("Failed to find 'fullscreen' setting in " + this._path);
                                }
                                return fullscreen;
                           },
                      set: function(fullscreen) {
                                fullscreen = typeof fullscreen === "boolean" && fullscreen;
                                var doc = this.read();
                                var node = this.findItem(doc, "android:windowFullscreen");
                                if (node) {
                                    node.textContent = fullscreen ? "true" : "false";
                                    this.write(doc);
                                } else {
                                    this._output.error("Failed to find 'fullscreen' setting in " + this._path);
                                }
                           }
                      });

/**
 * Set background colour while starting the app.
 * @param {String} colour Color in #rrggbb format
 * @returns {Boolean} true on success or false.
 */
XmlTheme.prototype.setSplash =
function(color, icon, text) {

    // Set colour in launchscreen fragment
    var bgPath = Path.dirname(this._path);
    bgPath = Path.resolve(bgPath, Path.join("..", "drawable", "launchscreen_bg.xml"));

    var doc = this.read(bgPath);
    var solids = doc.getElementsByTagName("solid");
    if (!solids || solids.length === 0) {
        this._output.error("Background not found in " + bgPath);
        return false;
    }

    var node = solids[0];
    node.setAttribute("android:color", color);

    // Set icon
    var item = doc.createElement("item");
    doc.documentElement.appendChild(item);

    var bitmap = doc.createElement("bitmap");
    bitmap.setAttribute("android:src", icon);
    bitmap.setAttribute("android:gravity", "center");
    item.appendChild(bitmap);

    // Use launchscreen fragment
    this.background = "@drawable/launchscreen_bg";

    this.write(doc, bgPath);

    // TODO better error handling
    return true;
};

/**
 * Read theme.xml
 * @param {String} [path] Path to XML file
 * @returns {xmldom.Document} XML Document
 * @private
 * @see {@link https://github.com/jindw/xmldom}
 */
XmlTheme.prototype.read =
function(path) {

    // TODO Error handling

    path = path ? path : this._path;

    var parser = new xmldom.DOMParser();
    var buf = FS.readFileSync(path, {"encoding": "utf8"});
    return parser.parseFromString(buf);
};

/**
 * Write theme.xml
 * @param {xmldom.Document} doc XML Document
 * @param {String} [path] Path to XML file
 * @private
 * @see {@link https://github.com/jindw/xmldom}
 */
XmlTheme.prototype.write =
function(doc, path) {

    // TODO Error handling

    path = path ? path : this._path;

    var serializer = new xmldom.XMLSerializer();
    var buf = serializer.serializeToString(doc);
    FS.writeFileSync(path, buf);
};

/**
 * Find first node by name
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
