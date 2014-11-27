// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require('path');
var ShellJS = require("shelljs");
var AndroidSDK = require("./AndroidSDK");
var Console = require("./Console");
var Project = require("./Project");
var TemplateFile = require("./TemplateFile");
var AdmZip = require("adm-zip");

/**
 * Android project class.
 * @extends Project
 * @throws {@link AndroidSDK~SDKNotFoundError} If the Android SDK was not found in the environment.
 * @constructor
 */
function AndroidProject() {

    this._sdk = new AndroidSDK();
}
AndroidProject.prototype = Project;

/**
 * Fill template files and put them into the project skeleton.
 * @function fillTemplates
 * @param {String} packageId Qualified package name.
 * @param {String} apiTarget Android API target (greater android-14).
 * @param {String} projectPath Path to root dir of project.
 * @returns {Boolean} true on success.
 * @memberOf AndroidProject
 */
AndroidProject.prototype.fillTemplates =
function(packageId, apiTarget, projectPath) {

    var parts = packageId.split('.');
    var packageName = parts[parts.length - 1];
    var data = {
        "packageId" : packageId,
        "packageName" : packageName,
        "apiTarget" : apiTarget
    };

    // AndroidManifest.xml
    var tpl = new TemplateFile(__dirname + Path.sep +
                               ".."+ Path.sep +
                               "data" + Path.sep +
                               "AndroidManifest.xml.tpl");
    tpl.render(data, projectPath + Path.sep + "AndroidManifest.xml");

    // build.xml
    tpl = new TemplateFile(__dirname + Path.sep +
                               ".."+ Path.sep +
                               "data" + Path.sep +
                               "build.xml.tpl");
    tpl.render(data, projectPath + Path.sep + "build.xml");

    // project.properties
    tpl = new TemplateFile(__dirname + Path.sep +
                               ".."+ Path.sep +
                               "data" + Path.sep +
                               "project.properties.tpl");
    tpl.render(data, projectPath + Path.sep + "project.properties");

    // MainActivity.java
    tpl = new TemplateFile(__dirname + Path.sep +
                               ".."+ Path.sep +
                               "data" + Path.sep +
                               "MainActivity.java.tpl");
    var activityPath = projectPath + Path.sep +
                       "src" + Path.sep +
                       parts.join(Path.sep);
    tpl.render(data, activityPath + Path.sep + "MainActivity.java");

    // Make html5 app dir and copy sample content
    ShellJS.mkdir("-p", projectPath + Path.sep + "assets");
    ShellJS.cp("-r",
               __dirname + Path.sep + ".."+ Path.sep + "data" + Path.sep + "www",
               projectPath + Path.sep + "assets");

    // TODO check for errors
    return true;
};

/**
 * Import Crosswalk libraries and auxiliary files into the project.
 * @function importCrosswalkFromDir
 * @param {String} crosswalkPath Location of unpacked Crosswalk distribution.
 * @param {String} projectPath Location of project to import Crosswalk into.
 * @returns {Boolean} true on success or false.
 * @memberof AndroidProject
 */
AndroidProject.prototype.importCrosswalkFromDir =
function(crosswalkPath, projectPath) {

    // Copy xwalk_core_library
    ShellJS.cp("-r",
               crosswalkPath + Path.sep + "xwalk_core_library",
               projectPath);

    // Copy jars
    ShellJS.cp(crosswalkPath + Path.sep + "template" + Path.sep + "libs" + Path.sep + "*.jar",
               projectPath + Path.sep + "libs");

    // Copy res
    ShellJS.cp("-rf",
               crosswalkPath + Path.sep + "template" + Path.sep + "res",
               projectPath);

    // TODO check for errors
    return true;
};

/**
 * Import Crosswalk libraries and auxiliary files into the project.
 * @function importCrosswalkFromZip
 * @param {String} crosswalkPath Location of unpacked Crosswalk distribution.
 * @param {String} projectPath Location of project to import Crosswalk into.
 * @returns {Boolean} true on success or false.
 * @memberof AndroidProject
 */
AndroidProject.prototype.importCrosswalkFromZip =
function(crosswalkPath, projectPath) {

    var zip = new AdmZip(crosswalkPath);
    if (!zip) {
        Console.error("Failed to open " + crosswalkPath);
        return false;
    }

    // Derive root entry from file name.
    var parts = crosswalkPath.split(Path.sep);
    var filename = parts[parts.length - 1];
    var base = filename.substring(0, filename.length - ".zip".length) + "/";

    var entry = zip.getEntry(base);
    if (!entry) {
        Console.error("Failed to find root entry " + base);
        return false;
    }

    // Extract xwalk_core_library
    var path;
    var name = base + "xwalk_core_library/";
    entry = zip.getEntry(name);
    if (entry) {
        path = projectPath + Path.sep + "xwalk_core_library";
        ShellJS.mkdir(path);
        zip.extractEntryTo(entry, path, false, true);
    } else {
        Console.error("Failed to find entry " + name);
        return false;
    }

    // Extract jars
    name = base + "template/libs/xwalk_runtime_java.jar";
    entry = zip.getEntry(name);
    if (entry) {
        zip.extractEntryTo(entry, projectPath + Path.sep + "libs", false, true);
    } else {
        Console.error("Failed to find entry " + name);
        return false;
    }

    name = base + "template/libs/xwalk_app_runtime_java.jar";
    entry = zip.getEntry(name);
    if (entry) {
        zip.extractEntryTo(entry, projectPath + Path.sep + "libs", false, true);
    } else {
        Console.error("Failed to find entry " + name);
        return false;
    }

    // Extract res
    name = base + "template/res/";
    entry = zip.getEntry(name);
    if (entry) {
        zip.extractEntryTo(entry, projectPath + Path.sep + "res", false, true);
    } else {
        Console.error("Failed to find entry " + name);
        return false;
    }

    return true;
};

/**
 * Turn a freshly created empty Android project into a Crosswalk project.
 * @function fillSkeletonProject
 * @param {String} packageId Qualified package name.
 * @param {String} apiTarget Android API target (greater android-14).
 * @param {String} projectPath Path to root dir of project.
 * @returns {Boolean} true on success.
 * @memberOf AndroidProject
 */
AndroidProject.prototype.fillSkeletonProject =
function(packageId, apiTarget, projectPath) {

    if (!this.fillTemplates(packageId, apiTarget, projectPath)) {
        return false;
    }

/* Import crosswalk from dir, maybe we need this again later on
 * for building against local app template.
    // Copy
    var dirs = ShellJS.ls('crosswalk-*.*.*.*');
    if (dirs.length === 0) {
        // Also try parent dir.
        // This is especially useful for tests that run in a temporary dir.
        dirs = ShellJS.ls('../crosswalk-*.*.*.*');
        if (dirs.length === 0) {
            Console.error("Unpacked Crosswalk not found in current or parent directory " + ShellJS.pwd());
            return false;
        }
    }
    var appTplPath = dirs[0];

    if (!this.importCrosswalkFromDir(appTplPath, projectPath)) {
        return false;
    }
*/

    var zips = ShellJS.ls('crosswalk-*.*.*.*.zip');
    if (zips.length === 0) {
        // Also try parent dir.
        // This is especially useful for tests that run in a temporary dir.
        zips = ShellJS.ls('../crosswalk-*.*.*.*.zip');
        if (zips.length === 0) {
            Console.error("Crosswalk Zip not found in current or parent directory " + ShellJS.pwd());
            return false;
        }
    }
    var zipFile = zips[zips.length - 1];

    return this.importCrosswalkFromZip(zipFile, projectPath);
};

/**
 * Implements {@link Project.generate}
 * @function generate
 * @memberOf AndroidProject
 */
AndroidProject.prototype.generate =
function(packageId, callback) {

    var minApiLevel = 19;
    var apiTarget;
    this._sdk.queryTarget(minApiLevel,
                          function(apiTarget, errormsg) {

        if (errormsg) {
            callback(errormsg);
            return;
        }

        this._sdk.generateProjectSkeleton(packageId, apiTarget,
                                          function(path, logmsg, errormsg) {

            if (!path || errormsg) {
                callback(errormsg);
                return;
            }

            var ret = this.fillSkeletonProject(packageId, apiTarget, path);
            if (!ret) {
                callback("Creating project template failed.");
                return;
            }

            Console.log("Project template created at '" + path + "'");
            callback(null);

        }.bind(this));
    }.bind(this));
};

AndroidProject.prototype.update =
function() {

    // TODO implement
};

AndroidProject.prototype.refresh =
function() {

    // TODO implement
};

/**
 * Enable ABIs so they are built into the APK.
 * @function enableABI
 * @param {String} [abi] ABI identifier "armeabi-v7a" / "x86". When not passed,
 *                       all ABIs are enabled.
 * @returns {Boolean} true on success or false.
 * @memberOf AndroidProject
 */
AndroidProject.prototype.enableABI =
function(abi) {

    if (!ShellJS.test("-d", "xwalk_core_library/libs")) {
        Console.error("This does not appear to be the root of a Crosswalk project.");
        return false;
    }

    ShellJS.pushd("xwalk_core_library/libs");

    var abiMatched = false;
    var list = ShellJS.ls(".");
    for (var i = 0; i < list.length; i++) {

        var entry = list[i];
        if (ShellJS.test("-d", entry)) {
            // This is a dir inside "libs", enable/disable depending
            // on which ABI we want.
            if (!abi) {
                // No ABI passed, enable all of them, this is default
                // status of the project.
                ShellJS.chmod("+rx", entry);
                abiMatched = true;
            } else if (abi === entry) {
                // enable
                ShellJS.chmod("+rx", entry);
                abiMatched = true;
            } else {
                // disable
                ShellJS.chmod("-rx", entry);
            }
        }
    }

    ShellJS.popd();
    return abiMatched;
};

/**
 * Rename the build APK to contain an ABI suffix, before the .apk suffix,
 * so when building multiple ABIs one after another, the subsequent APKs
 * do not overwrite the previously built ones.
 * @function abifyAPKNameName
 * @param {String} abi ABI name
 * @param {Boolean} release Whether we're building release or debug packages.
 * @returns {Boolean} true on success, or false.
 * @memberOf AndroidProject
 */
AndroidProject.prototype.abifyAPKName =
function(abi, release) {

    var apkInPattern;
    if (release) {
        apkInPattern = "*-release-unsigned.apk";
    } else {
        apkInPattern = "*-debug.apk";
    }

    var apkInPath = ShellJS.ls("bin" + Path.sep + apkInPattern)[0];
    if (!apkInPath) {
        Console.error("APK bin" + Path.sep + apkInPattern + " not found");
        return false;
    }

    var apkInName = apkInPath.split(Path.sep)[1];
    if (!ShellJS.test("-f", "bin" + Path.sep + apkInName)) {
        Console.error("APK bin" + Path.sep + apkInName + " not found");
        return false;
    }

    var base = apkInName.substring(0, apkInName.length - ".apk".length);
    var apkOutName = base + "." + abi + ".apk";
    ShellJS.mv("bin" + Path.sep + apkInName,
               "bin" + Path.sep + apkOutName);

    if (!ShellJS.test("-f", "bin" + Path.sep + apkOutName)) {
        Console.error("APK bin" + Path.sep + apkOutName + " not found");
        return false;
    }

    return true;
};

/**
 * Build APK for one ABI. This method is calling itself recursively, until
 * all ABIs are built.
 * @function buildABI
 * @param {Object} closure Information to pass between ABI build runs.
 * @memberOf AndroidProject
 */
AndroidProject.prototype.buildABI =
function(closure) {

    // If done with all the ABIs, terminate successfully.
    if (closure.abiIndex >= closure.abis.length) {
        this.enableABI();
        closure.callback(null);
        return;
    }

    // Pick and enable ABI.
    var abi = closure.abis[closure.abiIndex];
    if (this.enableABI(abi)) {
        closure.abiIndex++;
    } else {
        // Failed, enable all ABIs and terminate build.
        this.enableABI();
        closure.callback("Enabling ABI '" + abi + "' failed");
        return;
    }

    // Build for ABI.
    this._sdk.buildProject(closure.release, function(success) {

        if (success) {

            // Preserve APK by renaming it by ABI
            // Otherwise IA and ARM APKs would overwrite each other,
            // as we simply run ant twice.
            if (!this.abifyAPKName(abi, closure.release)) {
                // Failed, enable all ABIs and terminate build.
                this.enableABI();
                callback("Building ABI '" + abi + "' failed");
                return;
            }

            // Build next ABI.
            this.buildABI(closure);
            return;

        } else {
            // Failed, enable all ABIs and terminate build.
            this.enableABI();
            callback("Building ABI '" + abi + "' failed");
            return;
        }
    }.bind(this));
};

/**
 * Implements {@link Project.build}
 * @function build
 * @memberOf AndroidProject
 */
AndroidProject.prototype.build =
function(abis, release, callback) {

    var closure = {
        abis: abis,
        abiIndex : 0,
        release: release,
        callback: callback
    };

    // This builds all ABIs in a recursion (of sorts).
    this.buildABI(closure);
};

module.exports = AndroidProject;
