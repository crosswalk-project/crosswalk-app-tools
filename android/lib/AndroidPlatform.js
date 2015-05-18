// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");

var Path = require('path');
var ShellJS = require("shelljs");

var AndroidDependencies = require("./AndroidDependencies");
var AndroidSDK = require("./AndroidSDK");
var CrosswalkZip = require("./CrosswalkZip");

/**
 * Android project class.
 * @extends PlatformBase
 * @constructor
 * @param {Function} PlatformBase Base class constructor {@link PlatformBase}
 * @param {PlatformData} baseData Init data passed to the platform
 * @throws {@link AndroidSDK~SDKNotFoundError} If the Android SDK was not found in the environment.
 */
function AndroidPlatform(PlatformBase, baseData) {

    // Create base instance.
    var instance = new PlatformBase(baseData);
    var o = instance.output;

    // Override manually, because Object.extend() is not yet available on node.
    var names = Object.getOwnPropertyNames(AndroidPlatform.prototype);
    for (var i = 0; i < names.length; i++) {
        var key = names[i];
        if (key != "constructor") {
            instance[key] = AndroidPlatform.prototype[key];
        }
    }

    instance._sdk = new AndroidSDK(instance.application);
    instance._channel = "stable";

    return instance;
}

/**
 * Accessor function for platform-specific command-line argument spec.
 */
AndroidPlatform.getArgs =
function() {
    return {
        create: {
            "crosswalk": "\t\t\tChannel name (stable/beta/canary)\n" +
                         "\t\t\t\t\t\tor version number (w.x.y.z)"
        }
    };
};

/**
 * Accessor function for platform-specific environment variables spec.
 */
AndroidPlatform.getEnv =
function() {
    return {
        CROSSWALK_APP_TOOLS_CACHE_DIR: "Keep downloaded files in this dir"
    };
};

/**
 * Fill template files and put them into the project skeleton.
 * @param {String} apiTarget Android API target (greater android-14)
 * @param {String} platformPath Path to root dir of project
 * @returns {Boolean} True on success.
 */
AndroidPlatform.prototype.fillTemplates =
function(apiTarget, platformPath) {

    // Namespace util
    var util = this.application.util;

    var parts = this.packageId.split('.');
    var packageName = parts[parts.length - 1];
    var data = {
        "packageId" : this.packageId,
        "packageName" : packageName,
        "apiTarget" : apiTarget
    };

    // AndroidManifest.xml
    var tpl = new util.TemplateFile(Path.join(__dirname, "..", "data", "AndroidManifest.xml.tpl"));
    tpl.render(data, platformPath + Path.sep + "AndroidManifest.xml");

    // build.xml
    tpl = new util.TemplateFile(Path.join(__dirname, "..", "data", "build.xml.tpl"));
    tpl.render(data, platformPath + Path.sep + "build.xml");

    // project.properties
    tpl = new util.TemplateFile(Path.join(__dirname, "..", "data", "project.properties.tpl"));
    tpl.render(data, platformPath + Path.sep + "project.properties");

    // Make html5 app dir and copy sample content
    var assetsPath = Path.join(platformPath, "assets");
    ShellJS.mkdir("-p", assetsPath);
    var wwwPath = Path.join(assetsPath, "www");
    ShellJS.ln("-s", this.appPath, wwwPath);

    // TODO check for errors
    return true;
};

AndroidPlatform.prototype.writeActivityJava =
function(zipEntry) {

    var output = this.application.output;

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
    templateData = templateData.replace(templatePackage, this.packageId);

    // Change class name
    var templateClass = "AppTemplateActivity";
    index = templateData.search(templateClass);
    if (index < 0) {
        output.error("Failed to find template class '" + templateClass + "' in " + zipEntry.name);
        return false;
    }
    templateData = templateData.replace(templateClass, "MainActivity");

    // Create target directory
    var activityDirPath = Path.join(this.platformPath,
                                 "src",
                                 this.packageId.replace(/\./g, Path.sep));
    ShellJS.mkdir("-p", activityDirPath);
    if (!ShellJS.test("-d", activityDirPath)) {
        output.error("Failed to create activity dir " + activityDirPath);
        return false;
    }

    // Do not overwrite activity file because it may contain app-specific code
    // FIXME we should be smarter about this:
    // 1 - check if file is different from new content
    // 2 - if yes, create a ".new" file
    var activityFilePath = Path.join(activityDirPath, "MainActivity.java");
    if (ShellJS.test("-f", activityFilePath)) {

        // HACK force newline because we're in the midst of a progress indication
        output.write("\n");
        output.warning("File already exists: " + activityFilePath);

        var activityBackupFilename;
        var activityBackupPath;
        var i = 0;
        do {
            activityBackupFilename = "MainActivity.java.orig-" + i;
            activityBackupPath = Path.join(activityDirPath, activityBackupFilename);
            i++;
        } while (ShellJS.test("-f", activityBackupPath));

        ShellJS.mv(activityFilePath, activityBackupPath);
        output.warning("Existing activity file rename to: " + activityBackupPath);
        output.warning("Please port any custom java code to the new MainActivity.java");
    }

    // Write activity file
    FS.writeFileSync(activityFilePath, templateData);
    if (!ShellJS.test("-f", activityFilePath)) {
        output.error("Failed to write main activity " + activityFilePath);
        return false;
    }

    return true;
};

/**
 * Import Crosswalk libraries and auxiliary files into the project.
 * @param {String} crosswalkPath Location of unpacked Crosswalk distribution
 * @param {String} platformPath Location of project to import Crosswalk into
 * @returns {String} Imported version on success, otherwise null.
 */
AndroidPlatform.prototype.importCrosswalkFromZip =
function(crosswalkPath, platformPath) {

    var output = this.application.output;

    var indicator = output.createFiniteProgress("Extracting " + crosswalkPath);

    // Extract contents
    var zip = null;
    try {
        zip = new CrosswalkZip(crosswalkPath);
    } catch (e) {
        // HACK we're in the midst of a progress display, force line break
        ShellJS.rm("-f", crosswalkPath);
        output.write("\n");
        output.error("Failed to open " + crosswalkPath);
        output.error("Invalid file has been deleted, please try again");
        return null;
    }

    indicator.update(0.2);

    if (zip.version.major < 9) {
        output.error("Crosswalk version " + zip.version.major + " not supported. Use 8+.");
        return null;
    } else if (zip.version.major > 15) {
        output.warning("This tool has not been tested with Crosswalk " + zip.version.major + ".");
    }

    var entry = zip.getEntry(zip.root);
    if (!entry) {
        output.error("Failed to find root entry " + zip.root);
        return null;
    }

    indicator.update(0.4);

    // Extract xwalk_core_library
    var path;
    var name = zip.root + "xwalk_core_library/";
    entry = zip.getEntry(name);
    if (entry) {
        path = platformPath + Path.sep + "xwalk_core_library";
        // Remove existing dir to prevent stale files when updating crosswalk
        ShellJS.rm("-rf", path);
        ShellJS.mkdir(path);
        zip.extractEntryTo(entry, path);
    } else {
        output.error("Failed to find entry " + name);
        return null;
    }

    // Extract jars
    indicator.update(0.5);

    indicator.update(0.6);

    name = zip.root + "template/libs/xwalk_app_runtime_java.jar";
    entry = zip.getEntry(name);
    if (entry) {
        zip.extractEntryTo(entry, platformPath + Path.sep + "libs");
    } else {
        output.error("Failed to find entry " + name);
        return null;
    }

    indicator.update(0.7);

    // Extract main activity java file
    name = zip.root + "template/src/org/xwalk/app/template/AppTemplateActivity.java";
    entry = zip.getEntry(name);
    if (entry) {

        if (!this.writeActivityJava(entry))
            return null;

    } else {
        output.error("Failed to find in crosswalk release: " + name);
        return null;
    }

    indicator.update(0.8);

    // Extract res
    name = zip.root + "template/res/";
    entry = zip.getEntry(name);
    if (entry) {
        zip.extractEntryTo(entry, platformPath + Path.sep + "res");
    } else {
        output.error("Failed to find entry " + name);
        return null;
    }

    indicator.update(1);
    indicator.done();

    return zip.version.toString();
};

/**
 * Turn a freshly created empty Android project into a Crosswalk project.
 * @param {String} versionSpec Crosswalk version or channel (stable, beta, canary)
 * @param {String} platformPath Path to root dir of project
 * @param {Function} callback Callback(version, errormsg)
 * @returns {Boolean} True on success.
 */
AndroidPlatform.prototype.importCrosswalk =
function(versionSpec, platformPath, callback) {

    var output = this.application.output;

    var channel = null;
    var version = null;

    if (AndroidDependencies.CHANNELS.indexOf(versionSpec) > -1) {
        // versionSpec is a channel name
        channel = versionSpec;
    } else {
        version = versionSpec;
    }

    this.findCrosswalkVersion(version, channel,
                              function(version, channel, errormsg) {

        if (errormsg) {
            callback(null, errormsg);
            return;
        }

        output.info("Found version '" + version + "' in channel '" + channel + "'");

        // Download latest Crosswalk
        var deps = new AndroidDependencies(this.application, channel);
        deps.download(version, ".",
                      function(filename, errormsg) {

            if (errormsg) {
                callback(null, errormsg);
                return;
            }

            if (!filename) {
                callback(null, "Failed to download Crosswalk");
                return;
            }

            errormsg = null;
            var importedVersion = this.importCrosswalkFromZip(filename, platformPath);
            if (!importedVersion) {
                errormsg = "Failed to extract " + filename;
            }
            callback(importedVersion, errormsg);

        }.bind(this));
    }.bind(this));
};

/**
 * Implements {@link PlatformBase.create}
 */
AndroidPlatform.prototype.create =
function(packageId, args, callback) {

    var output = this.application.output;

    var minApiLevel = 21;
    this._sdk.queryTarget(minApiLevel,
                          function(apiTarget, errormsg) {

        if (errormsg) {
            callback(errormsg);
            return;
        }

        output.info("Building against API level " + apiTarget);

        this._sdk.generateProjectSkeleton(this.platformPath, this.packageId, apiTarget,
                                          function(path, logmsg, errormsg) {

            this.logOutput.write(logmsg);

            if (!path || errormsg) {
                callback(errormsg);
                return;
            }

            var versionSpec = null;
            if (args.crosswalk) {
                // TODO verify version/channel
                versionSpec = args.crosswalk;
            } else {
                versionSpec = "stable";
                output.info("Defaulting to download channel " + versionSpec);
            }

            if (!this.fillTemplates(apiTarget, path)) {
                callback("Failed to initialise project templates");
                return;
            }

            this.importCrosswalk(versionSpec, path,
                                 function(version, errormsg) {

                if (errormsg) {
                    output.error(errormsg);
                    callback("Creating project template failed");
                    return;
                }

                output.info("Project template created at '" + path + "'");
                callback(null);
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

/**
 * Find a specific version in a specific channel.
 * @param {String} version Version to look for, pick lastest if null is given
 * @param {String} channel Release channel to seach in, null for all channels
 * @param {Function} callback Callback (version, channel, errormsg)
 */
AndroidPlatform.prototype.findCrosswalkVersion =
function(version, channel, callback) {

    // Namespace util
    var util = this.application.util;

    var versionName = version ?
                        version :
                        "latest version";

    // Start with first channel if not given.
    if (!channel) {
        channel = AndroidDependencies.CHANNELS[0];
    }

    this.output.info("Looking for " + versionName + " in channel '" + channel + "'");

    var deps = new AndroidDependencies(this.application, channel);
    deps.fetchVersions(function(versions, errormsg) {

        if (errormsg) {
            callback(null, null, errormsg);
            return;
        }

        // Look for specific version?
        if (version &&
            versions.indexOf(version) > -1) {

            callback(version, channel, null);
            return;

        } else if (version) {

            // Try next channel.
            var channelIndex = AndroidDependencies.CHANNELS.indexOf(channel);
            if (channelIndex < AndroidDependencies.CHANNELS.length - 1) {
                this.output.info("Version " + version + " not found in '" + channel + "', trying next channel");
                channelIndex++;
                channel = AndroidDependencies.CHANNELS[channelIndex];
                this.findCrosswalkVersion(version, channel, callback);
            } else {
                // Already at last channel, version not found
                this.output.info("Version " + version + " not found in '" + channel + "', search failed");
                callback(null, null, "Version " + version + " seems not to be available on the server");
                return;
            }
        } else {
            // Use latest from current channel.
            version = util.IndexParser.pickLatest(versions, function (errmsg) {
                errormsg = errmsg;
            });
            callback(version, channel, errormsg);
            return;
        }
    }.bind(this));
};

/**
 * Implements {@link PlatformBase.update}
 */
AndroidPlatform.prototype.update =
function(versionSpec, args, callback) {

    var output = this.application.output;

    this.importCrosswalk(versionSpec, this.platformPath,
                         function(version, errormsg) {

        if (errormsg) {
            output.error(errormsg);
            callback("Updating crosswalk to '" + version + "' failed");
            return;
        }

        output.info("Project updated to crosswalk '" + version + "'");
        callback(null);
    });
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

        this.logOutput.write(data);

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
    }.bind(this);

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
function(configId, args, callback) {

    var output = this.application.output;

    // TODO should we cd back afterwards?
    process.chdir(this.platformPath);

    var closure = {
        abis: ["armeabi-v7a", "x86"], // TODO export option
        abiIndex : 0,
        release: configId == "release", // TODO verify above
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
