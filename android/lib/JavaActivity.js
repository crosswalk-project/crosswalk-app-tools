// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Path = require('path');

var ShellJS = require("shelljs");

/**
 * JavaActivity wrapper.
 * @param {OutputIface} output Output implementation
 * @param {String} path Path to android app's main java activity file
 * @constructor
 */
function JavaActivity(output, path) {

    this._output = output;
    this._path = path;
}

/**
 * Calculate java source path for package ID.
 * @param {String} basePath Project location
 * @param {String} packageId Package ID
 * @returns {String} Path where java file will be located.
 * @static
 */
JavaActivity.prototype.pathForPackage =
function(basePath, packageId) {

    var packagePath = Path.join(basePath,
                                "src",
                                packageId.replace(/\./g, Path.sep));

    return packagePath;
};

// Also assign statically
JavaActivity.pathForPackage = JavaActivity.prototype.pathForPackage;

/**
 * Import java activity file from crosswalk zip release.
 * @param {adm-zip.ZipEntry} zipEntry Entry holding the activity
 * @param {String} packageId Package identifier for the project
 * @param {String} activityClassName Class ame for the Activity
 * @returns {Boolean} true on success, otherwise false.
 */
JavaActivity.prototype.importFromZip =
function(zipEntry, packageId, activityClassName) {

    var output = this._output;

    var templateData = zipEntry.getData().toString();
    if (!templateData) {
        output.error("Java main activity file could not be extracted");
        return false;
    }

    // Change package name
    var templatePackage = "org.xwalk.app.template";
    var index = templateData.search(templatePackage);
    if (index < 0) {
        output.error("Failed to find template package '" + templatePackage + "' in " + zipEntry.name);
        return false;
    }
    templateData = templateData.replace(templatePackage, packageId);

    // Change class name
    var templateClass = "AppTemplateActivity";
    index = templateData.search(templateClass);
    if (index < 0) {
        output.error("Failed to find template class '" + templateClass + "' in " + zipEntry.name);
        return false;
    }
    templateData = templateData.replace(templateClass, activityClassName);

    // Always load app from manifest instead of index.html
    templateData = templateData.replace('loadAppFromUrl("file:///android_asset/www/index.html")',
                                        'loadAppFromManifest("app://' + packageId + '/manifest.json")');

    // Do not overwrite activity file because it may contain app-specific code
    // FIXME we should be smarter about this:
    // 1 - check if file is different from new content
    // 2 - if yes, create a ".new" file
    if (ShellJS.test("-f", this._path)) {

        output.warning("File already exists: " + this._path);

        var activityDirPath = Path.dirname(this._path);
        var activityBackupFilename;
        var activityBackupPath;
        var i = 0;
        do {
            activityBackupFilename = "MainActivity.java.orig-" + i;
            activityBackupPath = Path.join(activityDirPath, activityBackupFilename);
            i++;
        } while (ShellJS.test("-f", activityBackupPath));

        ShellJS.mv(this._path, activityBackupPath);
        output.warning("Existing activity file rename to: " + activityBackupPath);
        output.warning("Please port any custom java code to the new MainActivity.java");
    }

    // Write activity file
    FS.writeFileSync(this._path, templateData);
    if (!ShellJS.test("-f", this._path)) {
        output.error("Failed to write main activity " + this._path);
        return false;
    }

    return true;
};

/**
 * Enable or disable animatable view.
 * @param {Boolean} enable True if to be enabled, false to disable feature
 * @returns {Boolean} True on success, otherwise false.
 */
JavaActivity.prototype.enableAnimatableView =
function(enable) {

    return this.editOnCreate(enable, "        setUseAnimatableView(true);");
};

/**
 * Enable or disable remote debugging.
 * @param {Boolean} enable True if to be enabled, false to disable feature
 * @returns {Boolean} True on success, otherwise false.
 */
JavaActivity.prototype.enableRemoteDebugging =
function(enable) {

    return this.editOnCreate(enable, "        setRemoteDebugging(true);");
};

/**
 * Enable or disable fullscreen.
 * @param {Boolean} enable True if to be enabled, false to disable feature
 * @returns {Boolean} True on success, otherwise false.
 */
JavaActivity.prototype.enableFullscreen =
function(enable) {

    return this.editOnCreate(enable, "        setIsFullscreen(true);");
};

/**
 * Enable or disable "keep screen on".
 * @param {Boolean} enable True if to be enabled, false to disable feature
 * @returns {Boolean} True on success, otherwise false.
 */
JavaActivity.prototype.enableKeepScreenOn =
function(enable) {

    return this.editOnCreate(enable, "        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);");
};

/**
 * Edit the onCreate() method inserting or removing config statements.
 * @param {Boolean} insert If true, insert statement if missing, otherwise remove it
 * @param {String} stmt Statement to edit
 * @returns {Boolean} True on success, otherwise false.
 */
JavaActivity.prototype.editOnCreate =
function(insert, stmt) {

    // FIXME better error handling

    var inBuf = FS.readFileSync(this._path, {"encoding": "utf8"});
    var lines = inBuf.split("\n");
    var outBuf = [];

    for (var i = 0; i < lines.length; i++) {

        var line = lines[i];
        if (line === "    public void onCreate(Bundle savedInstanceState) {") {

            if (insert) {
                i = this.insertIfMissing(lines, i, stmt, outBuf);
            } else {
                i = this.skipIfPresent(lines, i, stmt, outBuf);
            }
        }
        outBuf.push(lines[i]);
    }

    FS.writeFileSync(this._path, outBuf.join("\n"));

    return true;
};


/**
 * Insert configuration statement if not already present.
 * @param {String[]} lines Source input lines
 * @param {Integer} i Current line counter
 * @param {String} stmt Statement to insert
 * @param {String[]} outBuf Output lines
 * @returns {Integer} New current line counter.
 * @private
 */
JavaActivity.prototype.insertIfMissing =
function(lines, i, stmt, outBuf) {

    found = false;
    while (lines[i] !== "        super.onCreate(savedInstanceState);") {
        outBuf.push(lines[i]);
        i++;
        if (lines[i] === stmt) {
            found = true;
            break;
        }
    }

    if (!found) {
        outBuf.push(stmt);
    }

    return i;
};

/**
 * Insert configuration statement if not already present.
 * @param {String[]} lines Source input lines
 * @param {Integer} i Current line counter
 * @param {String} stmt Statement to insert
 * @param {String[]} outBuf Output lines
 * @returns {Integer} New current line counter.
 * @private
 */
JavaActivity.prototype.skipIfPresent =
function(lines, i, stmt, outBuf) {

    found = false;
    while (lines[i] !== "    }") {
        outBuf.push(lines[i]);
        i++;
        if (lines[i] === stmt) {
            // skip
            i++;
            break;
        }
    }

    return i;
};

module.exports = JavaActivity;
