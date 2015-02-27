// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var AdmZip = require("adm-zip");
var Path = require('path');
var ShellJS = require("shelljs");

var AndroidProjectDeps = require("./AndroidProjectDeps");
var AndroidSDK = require("./AndroidSDK");
var PlatformBase = require("../PlatformBase");

var TemplateFile = require("../util/TemplateFile");

/**
 * Android project class.
 * @extends PlatformBase
 * @constructor
 * @param {PlatformData} platformData Init data passed to the platform
 * @throws {@link AndroidSDK~SDKNotFoundError} If the Android SDK was not found in the environment.
 */
function AndroidPlatform(platformData) {

    // Chain up
    PlatformBase.call(this, platformData);

    this._sdk = new AndroidSDK(this.application);
    this._channel = "stable";
}
AndroidPlatform.prototype = PlatformBase.prototype;

/**
 * Fill template files and put them into the project skeleton.
 * @param {String} apiTarget Android API target (greater android-14)
 * @param {String} projectPath Path to root dir of project
 * @returns {Boolean} True on success.
 */
AndroidPlatform.prototype.fillTemplates =
function(apiTarget, projectPath) {

    var parts = this.packageId.split('.');
    var packageName = parts[parts.length - 1];
    var data = {
        "packageId" : this.packageId,
        "packageName" : packageName,
        "apiTarget" : apiTarget
    };

    // AndroidManifest.xml
    var tpl = new TemplateFile(__dirname + Path.sep +
                               ".."+ Path.sep + ".."+ Path.sep +
                               "data" + Path.sep +
                               "AndroidManifest.xml.tpl");
    tpl.render(data, projectPath + Path.sep + "AndroidManifest.xml");

    // build.xml
    tpl = new TemplateFile(__dirname + Path.sep +
                               ".."+ Path.sep + ".."+ Path.sep +
                               "data" + Path.sep +
                               "build.xml.tpl");
    tpl.render(data, projectPath + Path.sep + "build.xml");

    // project.properties
    tpl = new TemplateFile(__dirname + Path.sep +
                               ".."+ Path.sep + ".."+ Path.sep +
                               "data" + Path.sep +
                               "project.properties.tpl");
    tpl.render(data, projectPath + Path.sep + "project.properties");

    // MainActivity.java
    tpl = new TemplateFile(__dirname + Path.sep +
                               ".."+ Path.sep + ".."+ Path.sep +
                               "data" + Path.sep +
                               "MainActivity.java.tpl");
    var activityPath = projectPath + Path.sep +
                       "src" + Path.sep +
                       parts.join(Path.sep);
    tpl.render(data, activityPath + Path.sep + "MainActivity.java");

    // Make html5 app dir and copy sample content
    var assetsPath = Path.join(projectPath, "assets");
    ShellJS.mkdir("-p", assetsPath);
    var wwwPath = Path.join(assetsPath, "www");
    ShellJS.ln("-s", this.appPath, wwwPath);

    // TODO check for errors
    return true;
};

/**
 * Import Crosswalk libraries and auxiliary files into the project.
 * @param {String} crosswalkPath Location of unpacked Crosswalk distribution
 * @param {String} projectPath Location of project to import Crosswalk into
 * @returns {Boolean} True on success or false.
 */
AndroidPlatform.prototype.importCrosswalkFromDir =
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
 * @param {String} crosswalkPath Location of unpacked Crosswalk distribution
 * @param {String} projectPath Location of project to import Crosswalk into
 * @returns {Boolean} True on success or false.
 */
AndroidPlatform.prototype.importCrosswalkFromZip =
function(crosswalkPath, projectPath) {

    var output = this.application.output;
    var indicator = output.createFiniteProgress("Extracting " + crosswalkPath);

    var zip = new AdmZip(crosswalkPath);
    if (!zip) {
        output.error("Failed to open " + crosswalkPath);
        return false;
    }

    indicator.update(0.1);

    // Derive root entry from file name.
    var parts = crosswalkPath.split(Path.sep);
    var filename = parts[parts.length - 1];
    var base = filename.substring(0, filename.length - ".zip".length) + "/";

    indicator.update(0.2);

    // Extract major version
    var numbers = base.split("-")[1].split(".");
    var major = numbers[0];
    if (major < 8) {
        output.error("Crosswalk version " + major + " not supported. Use 8+.");
        return false;
    } else if (major > 10) {
        output.warning("This tool has not been tested with Crosswalk " + major + ".");
    }

    indicator.update(0.3);

    var entry = zip.getEntry(base);
    if (!entry) {
        output.error("Failed to find root entry " + base);
        return false;
    }

    indicator.update(0.4);

    // Extract xwalk_core_library
    var path;
    var name = base + "xwalk_core_library/";
    entry = zip.getEntry(name);
    if (entry) {
        path = projectPath + Path.sep + "xwalk_core_library";
        ShellJS.mkdir(path);
        zip.extractEntryTo(entry, path, false, true);
    } else {
        output.error("Failed to find entry " + name);
        return false;
    }

    // Extract jars
    indicator.update(0.5);

    if (major === 8) {
        // Only for Version 8.
        name = base + "template/libs/xwalk_runtime_java.jar";
        entry = zip.getEntry(name);
        if (entry) {
            zip.extractEntryTo(entry, projectPath + Path.sep + "libs", false, true);
        } else {
            output.error("Failed to find entry " + name);
            return false;
        }
    }

    indicator.update(0.6);

    name = base + "template/libs/xwalk_app_runtime_java.jar";
    entry = zip.getEntry(name);
    if (entry) {
        zip.extractEntryTo(entry, projectPath + Path.sep + "libs", false, true);
    } else {
        output.error("Failed to find entry " + name);
        return false;
    }

    indicator.update(0.7);

    // Extract res
    name = base + "template/res/";
    entry = zip.getEntry(name);
    if (entry) {
        zip.extractEntryTo(entry, projectPath + Path.sep + "res", false, true);
    } else {
        output.error("Failed to find entry " + name);
        return false;
    }

    indicator.update(1);
    indicator.done();

    return true;
};

/**
 * Turn a freshly created empty Android project into a Crosswalk project.
 * @param {String} localCrosswalk Local Crosswalk download or null
 * @param {String} channel Crosswalk channel (stable, beta, canary) or null
 * @param {String} apiTarget Android API target (greater android-14)
 * @param {String} projectPath Path to root dir of project
 * @returns {Boolean} True on success.
 */
AndroidPlatform.prototype.fillSkeletonProject =
function(localCrosswalk, channel, apiTarget, projectPath, callback) {

    var output = this.application.output;

    if (!this.fillTemplates(apiTarget, projectPath)) {
        callback("Failed to initialise project templates");
        return;
    }

    // Use local Crosswalk if path given, and not a channel identifier.
    if (localCrosswalk) {

        output.info("Attempting to use local Crosswalk " + localCrosswalk);
        if (ShellJS.test("-f", localCrosswalk) ||
            ShellJS.test("-L", localCrosswalk)) {

            var ret = this.importCrosswalkFromZip(localCrosswalk, projectPath);
            if (ret) {
                callback(null);
                return;
            } else {
                output.warning("Import of local Crosswalk failed, attempting download ...");
            }
        }
    }

    // Download latest Crosswalk
    var deps = new AndroidProjectDeps(this.application, channel);
    deps.fetchVersions(function(versions, errormsg) {

        if (errormsg) {
            callback(errormsg);
            return;
        }

        if (versions.length === 0) {
            callback("Failed to load available Crosswalk versions for channel " + channel);
            return;
        }

        // Look for existing download
        var version = deps.pickLatest(versions);
        output.info("Latest version is " + version);
        var filename = deps.findLocally(version);
        if (filename) {
            output.info("Using local " + filename);
            var ret = this.importCrosswalkFromZip(filename, projectPath);
            if (!ret) {
                errormsg = "Failed to extract " + filename;
            }
            callback(errormsg);
            return;
        }

        // Download
        deps.download(version, ".", function(filename, errormsg) {

            if (errormsg) {
                callback(errormsg);
                return;
            }

            if (!filename) {
                callback("Failed to download Crosswalk");
                return;
            }

            errormsg = null;
            var ret = this.importCrosswalkFromZip(filename, projectPath);
            if (!ret) {
                errormsg = "Failed to extract " + filename;
            }
            callback(errormsg);

        }.bind(this));
    }.bind(this));
};

/**
 * Implements {@link PlatformBase.generate}
 */
AndroidPlatform.prototype.generate =
function(options, callback) {

    var output = this.application.output;

    var minApiLevel = 19;
    var apiTarget;
    this._sdk.queryTarget(minApiLevel,
                          function(apiTarget, errormsg) {

        if (errormsg) {
            callback(errormsg);
            return;
        }

        this._sdk.generateProjectSkeleton(this.platformPath, this.packageId, apiTarget,
                                          function(path, logmsg, errormsg) {

            if (!path || errormsg) {
                callback(errormsg);
                return;
            }

            var localCrosswalk = options ? options.crosswalk : null;
            var channel = "stable";
            if (options &&
                options.channel &&
                AndroidProjectDeps.CHANNELS.indexOf(options.channel) >= 0) {
                channel = options.channel;
            } else {
                output.info("Defaulting to download channel " + channel);
            }

            this.fillSkeletonProject(localCrosswalk, channel, apiTarget, path,
                                     function(errormsg) {

                if (errormsg) {
                    output.error(errormsg);
                    callback("Creating project template failed.");
                    return;
                }

                output.info("Project template created at '" + path + "'");
                callback(null);
            });
        }.bind(this));
    }.bind(this));
};

AndroidPlatform.prototype.update =
function() {

    // TODO implement
};

AndroidPlatform.prototype.refresh =
function() {

    // TODO implement
};

/**
 * Enable ABIs so they are built into the APK.
 * @param {String} [abi] ABI identifier "armeabi-v7a" / "x86". When not passed,
 *                       all ABIs are enabled
 * @returns {Boolean} True on success or false.
 */
AndroidPlatform.prototype.enableABI =
function(abi) {

    var output = this.application.output;

    if (!ShellJS.test("-d", "xwalk_core_library/libs")) {
        output.error("This does not appear to be the root of a Crosswalk project.");
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
 * @param {String} abi ABI name
 * @param {Boolean} release Whether we're building release or debug packages
 * @returns {String} Filename on success, otherwise null.
 */
AndroidPlatform.prototype.abifyAPKName =
function(abi, release) {

    var output = this.application.output;

    var apkInPattern;
    if (release) {
        apkInPattern = "*-release-unsigned.apk";
    } else {
        apkInPattern = "*-debug.apk";
    }

    var apkInPath = ShellJS.ls("bin" + Path.sep + apkInPattern)[0];
    if (!apkInPath) {
        output.error("APK bin" + Path.sep + apkInPattern + " not found");
        return null;
    }

    var apkInName = apkInPath.split(Path.sep)[1];
    if (!ShellJS.test("-f", "bin" + Path.sep + apkInName)) {
        output.error("APK bin" + Path.sep + apkInName + " not found");
        return null;
    }

    var base = apkInName.substring(0, apkInName.length - ".apk".length);
    var apkOutName = base + "." + abi + ".apk";
    ShellJS.mv("bin" + Path.sep + apkInName,
               "bin" + Path.sep + apkOutName);

    if (!ShellJS.test("-f", "bin" + Path.sep + apkOutName)) {
        output.error("APK bin" + Path.sep + apkOutName + " not found");
        return null;
    }

    return apkOutName;
};

/**
 * Build APK for one ABI. This method is calling itself recursively, until
 * all ABIs are built.
 * @param {Object} Closure Information to pass between ABI build runs
 */
AndroidPlatform.prototype.buildABI =
function(closure) {

    var output = this.application.output;

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

    // Progress display
    var indicator = output.createInfiniteProgress("Building " + abi);
    this._sdk.onData = function(data) {

        // Scan first 7 chars if data starts with a [tag]
        var tag = null;
        for (var i = 0; i < 7 && i < data.length; i++) {
            if (data[i] === '[') {

                // Scan on a bit if there's a closing ']'
                for (j = i+1; j < i+15; j++) {
                    if (data[j] === ']') {
                        tag = data.substring(i+1, j);
                        indicator.update(tag);
                        return;
                    }
                }
            } else if (data[i] != ' ') {
                break;
            }
        }
    };

    // Build for ABI.
    this._sdk.buildProject(closure.release, function(success) {

        indicator.done();
        if (success) {

            // Preserve APK by renaming it by ABI
            // Otherwise IA and ARM APKs would overwrite each other,
            // as we simply run ant twice.
            var apk = this.abifyAPKName(abi, closure.release);
            if (apk) {
                closure.apks.push(apk);
            } else {
                // Failed, enable all ABIs and terminate build.
                this.enableABI();
                closure.callback("Building ABI '" + abi + "' failed");
                return;
            }

            // Delete unaligned APK, so only the ones that are to be used
            // remain, and there's no confusion.
            ShellJS.rm("bin" + Path.sep + "*-debug-unaligned.apk");

            // Build next ABI.
            this.buildABI(closure);
            return;

        } else {
            // Failed, enable all ABIs and terminate build.
            this.enableABI();
            closure.callback("Building ABI '" + abi + "' failed");
            return;
        }
    }.bind(this));
};

/**
 * Implements {@link PlatformBase.build}
 */
AndroidPlatform.prototype.build =
function(abis, release, callback) {

    var output = this.application.output;

    // TODO should we cd back afterwards?
    process.chdir(this.platformPath);
    
    var closure = {
        abis: abis,
        abiIndex : 0,
        release: release,
        apks: [],
        callback: function(errormsg) {

            if (!errormsg) {

                for (var i = 0; i < closure.apks.length; i++) {

                    // Export APKs to package folder
                    var packagePath = Path.join(this.platformPath, "bin", closure.apks[i]);
                    this.exportPackage(packagePath);

                    output.highlight("  pkg/" + closure.apks[i]);
                }
            }
            callback(errormsg);
        }.bind(this)
    };

    // This builds all ABIs in a recursion (of sorts).
    this.buildABI(closure);
};

module.exports = AndroidPlatform;
