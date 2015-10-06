// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");

var ShellJS = require("shelljs");

function ProjectProperties(path, output) {

    if (!ShellJS.test("-f", path)) {
        throw new Error("File not found: " + path);
    }

    this._path = path;
    this._output = output;
}

/**
 * Value of android.library.
 * @member {String} androidLibrary String values are "true"/"false"/null
 * @instance
 * @memberOf ProjectProperties
 */
Object.defineProperty(ProjectProperties.prototype, "androidLibrary", {
                      get: function() {
                                return this.read("android.library");
                           },
                      set: function(value) {
                                if (["true", "false", null],indexOf(value) < 0){
                                    this._output.error("Invalid value for project.properties android.library=" + value);
                                    return;
                                }
                                this.write("android.library", value);
                           }
                      });

/**
 * Value of android.library.reference.1
 * @member {String} androidLibraryReference1 String values are "xwalk_core_library"/"xwalk_shared_library"
 * @instance
 * @memberOf ProjectProperties
 */
Object.defineProperty(ProjectProperties.prototype, "androidLibraryReference1", {
                      get: function() {
                                return this.read("android.library.reference.1");
                           },
                      set: function(value) {
                                if (["xwalk_core_library", "xwalk_shared_library"].indexOf(value) < 0){
                                    this._output.error("Invalid value for project.properties android.library.reference.1=" + value);
                                    return;
                                }
                                this.write("android.library.reference.1", value);
                           }
                      });

/**
 * Value of target.
 * @member {String} target Android SDK target, e.g. android-21
 * @instance
 * @memberOf ProjectProperties
 */
Object.defineProperty(ProjectProperties.prototype, "target", {
                      get: function() {
                                return this.read("target");
                           },
                      set: function(value) {
                                var a = value.split("-");
                                if (a[0] === "android" && a[1] > 14) {
                                    this.write("target", value);
                                } else {
                                    this._output.error("Invalid value for project.properties target=" + value);
                                }
                           }
                      });

ProjectProperties.prototype.read =
function(key) {

    var buffer = FS.readFileSync(this._path, {"encoding": "utf8"});
    if (!buffer) {
        output.error("Failed to read " + this._path);
        return null;
    }

    var k = key + "=";
    var lines = buffer.split("\n");
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.substring(0, k.length) === k) {
            // matching line
            return line.substring(k.length);
        }
    }

    return null;   
};

ProjectProperties.prototype.write =
function(key, value) {

    var buffer = FS.readFileSync(this._path, {"encoding": "utf8"});
    if (!buffer) {
        output.error("Failed to read " + this._path);
        return false;
    }

    var k = key + "=";
    var lines = buffer.split("\n");
    var outBuf = ""; 
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.substring(0, k.length) === k) {
            // matching line
            outBuf += k + value + "\n";
        } else {
            outBuf += line + "\n";
        }
    }

    FS.writeFileSync(this._path, outBuf);
    // TODO check ret
    return true;
};

module.exports = ProjectProperties;