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
 */
function JavaActivity(output, path) {

    this._output = output;
    this._path = path;
}

/**
 * Import java activity file from crosswalk zip release.
 * @param {adm-zip.ZipEntry} zipEntry Entry holding the activity
 * @param {String} packageId Package identifier for the project
 * @returns {Boolean} true on success, otherwise false.
 */
JavaActivity.prototype.importFromZip =
function(zipEntry, packageId) {

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
    templateData = templateData.replace(templateClass, "MainActivity");

    // Do not overwrite activity file because it may contain app-specific code
    // FIXME we should be smarter about this:
    // 1 - check if file is different from new content
    // 2 - if yes, create a ".new" file
    if (ShellJS.test("-f", this._path)) {

        // HACK force newline because we're in the midst of a progress indication
        output.write("\n");
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
 * Enable remote debugging.
 */
JavaActivity.prototype.enableRemoteDebugging =
function() {

    var inBuf = FS.readFileSync(this._path, {"encoding": "utf8"});
    var lines = inBuf.split("\n");
    var outBuf = [];

    for (var i = 0; i < lines.length; i++) {

        var line = lines[i];
        outBuf.push(line);

        if (line === "    public void onCreate(Bundle savedInstanceState) {") {

            // also write next line, the super call.
            i++;
            line = lines[i];
            outBuf.push(line);

            // insert setting
            outBuf.push("        setRemoteDebugging(true);");
        }
    }

    FS.writeFileSync(this._path, outBuf.join("\n"));
};

module.exports = JavaActivity;
