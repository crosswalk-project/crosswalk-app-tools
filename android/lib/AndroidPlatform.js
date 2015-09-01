// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Path = require('path');

var MkTemp = require('mktemp');
var ShellJS = require("shelljs");

var AndroidDependencies = require("./AndroidDependencies");
var AndroidManifest = require("./AndroidManifest");
var AndroidSDK = require("./AndroidSDK");
var JavaActivity = require("./JavaActivity");
var XmlTheme = require("./XmlTheme");

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
 * @static
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
 * @static
 */
AndroidPlatform.getEnv =
function() {
    return {
        CROSSWALK_APP_TOOLS_CACHE_DIR: "Keep downloaded files in this dir"
    };
};

/**
 * Check host setup.
 * @param {OutputIface} output Output to write to
 * @param {Function} callback Function(success) to be called when done
 * @static
 */
AndroidPlatform.check =
AndroidPlatform.prototype.check =
function(output, callback) {

    // Checking deps
    var deps = [
        "android",
        "ant",
        "java"
    ];

    var found = true;
    deps.forEach(function (dep) {
        var path = ShellJS.which(dep);
        var msg = "Checking for " + dep + "... " + path;
        if (path) {
            output.info(msg);
        } else {
            found = false;
            output.error(msg);
        }
    });

    if (!found) {
        callback(false);
        return;
    }

    // Build dummy project
    var app = {
        output: output
    };

    ShellJS.pushd(ShellJS.tempdir());
    var dir = MkTemp.createDirSync("XXXXXX");
    // Delete dir right after, just allocate name.
    ShellJS.rm("-rf", dir);
    ShellJS.popd();

    var path = Path.join(ShellJS.tempdir(), dir);
    output.info("Testing dummy project in " + path);

    var dummyPackageId = "com.example.foo";
    var dummyLog = "";
    var sdk = new AndroidSDK(app);
    // Progress display
    var indicator = output.createInfiniteProgress("Building " + dummyPackageId);
    sdk.onData = function(data) {

        dummyLog += data;

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
    sdk.generateProjectSkeleton(path, dummyPackageId, "android-21",
                                function (path, logmsg, errormsg) {

        dummyLog += logmsg;

        if (!path || errormsg) {
            output.error(errormsg);
            ShellJS.rm("-rf", path);
            output.error("Generating project failed");
            if (dummyLog) {
                FS.writeFileSync(path, dummyLog);
                output.error("Consult logfile " + path);
            }
            callback(false);
            return;
        }

        // Build
        ShellJS.pushd(path);
        sdk.buildProject(false,
                         function(success) {

            ShellJS.popd();
            ShellJS.rm("-rf", path);
            indicator.done();
            if (!success) {
                output.error("Building project failed");
                if (dummyLog) {
                    FS.writeFileSync(path, dummyLog);
                    output.error("Consult logfile " + path);
                }
            }
            callback(success);
        });
    });
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
        "packageName" : this.packageId,
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

/**
 * Import Crosswalk libraries and auxiliary files into the project.
 * @param {String} crosswalkPath Location of unpacked Crosswalk distribution
 * @param {String} platformPath Location of project to import Crosswalk into
 * @returns {String} Imported version on success, otherwise null.
 */
AndroidPlatform.prototype.importCrosswalkFromZip =
function(crosswalkPath, platformPath) {

    // Namespace util
    var util = this.application.util;

    var output = this.application.output;

    var indicator = output.createFiniteProgress("Extracting " + crosswalkPath);

    // Extract contents
    var zip = null;
    try {
        zip = new util.CrosswalkZip(crosswalkPath);
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

        // Create path
        var activityDirPath = JavaActivity.pathForPackage(platformPath, this.packageId);
        ShellJS.mkdir("-p", activityDirPath);
        if (!ShellJS.test("-d", activityDirPath)) {
            output.error("Failed to create activity dir " + activityDirPath);
            return false;
        }

        var activity = new JavaActivity(output,
                                        Path.join(activityDirPath, "MainActivity.java"));
        if (!activity.importFromZip(entry, this.packageId))
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

            // Remove _* from the default set of assets that are ignored
            // see sdk/tools/ant/build.xml for more info
            // the following is the default, without '_*'
            'aapt.ignore.assets = "!.svn:!.git:.*:!CVS:!thumbs.db:!picasa.ini:!*.scc:*~"\n'.toEnd(path + Path.sep + 'ant.properties');

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
        apkInPattern = "-release-unsigned.apk";
    } else {
        apkInPattern = "-debug.apk";
    }

    ShellJS.pushd("bin");
    var apkInName = ShellJS.ls("*" + apkInPattern)[0];
    ShellJS.popd();

    if (!ShellJS.test("-f", "bin" + Path.sep + apkInName)) {
        output.error("APK bin" + Path.sep + apkInName + " not found");
        return null;
    }

    var base = apkInName.substring(0, apkInName.length - apkInPattern.length);
    var apkOutName = base + "-" +
                     this.application.manifest.appVersion + "-" +
                     (release ? "release-unsigned" : "debug") + "." +
                     abi + ".apk";
    ShellJS.mv("bin" + Path.sep + apkInName,
               "bin" + Path.sep + apkOutName);

    if (!ShellJS.test("-f", "bin" + Path.sep + apkOutName)) {
        output.error("APK bin" + Path.sep + apkOutName + " not found");
        return null;
    }

    return apkOutName;
};

/**
 * Generate versionCode for AndroidManifest.xml
 * @param {String} abi ABI to create the code for
 * @returns {String} Version code or null on failure.
 * @private
 * @static
 */
AndroidPlatform.prototype.generateVersionCode =
function(output, appVersion, abi) {

    function zeropad(string, length) {

        var str = (typeof string === "string") ? string : "";
        var padLen = length - str.length;
        var pad = Array(padLen + 1).join("0");
        return pad + str;
    }

    var abiCodes = {
        "armeabi-v7a": 2,
//        "arm64": 3, TODO check name
        "x86": 6
//        "x86_64": 7, TODO check name
    };
    var versionNums = appVersion.split(".");

    var abiCode = abiCodes[abi];
    if (!abiCode) {
        output.error("Unsupported ABI code '" + abi + "'");
        return null;
    }

    // The format for versionCode is "ammiiccc", where
    // a .. abi
    // m .. major release number (optional, or 0)
    // i .. minor release number (optional, or 0)
    // c .. micro release number
    // This is a simplified version of
    // https://software.intel.com/en-us/blogs/2012/11/12/how-to-publish-your-apps-on-google-play-for-x86-based-android-devices-using
    //
    // We build the array holding the numbers in a reverse fashion,
    // that's easier with the optional parts.
    var reversedCode = ["000", "00", "00", "0"];
    var reversedVersion = versionNums.reverse();

    reversedCode[0] = zeropad(reversedVersion[0], 3);

    reversedCode[1] = zeropad(reversedVersion[1], 2);

    reversedCode[2] = zeropad(reversedVersion[2], 2);

    reversedCode[3] = abiCode;

    return reversedCode.reverse().join("");
};

/**
 * Update versionCode in AndroidManifest.xml for ABI
 * @param {String} abi ABI to generate the versionCode for
 * @returns {Boolean} true on success, false on failure.
 */
AndroidPlatform.prototype.updateVersionCode =
function(abi) {

    var output = this.application.output;

    var manifest = new AndroidManifest(this.application.output,
                                       Path.join(this.platformPath, "AndroidManifest.xml"));

    var versionCode = this.generateVersionCode(this.application.output,
                                               this.application.manifest.appVersion,
                                               abi);

    output.info("Using android:versionCode '" + versionCode + "'");
    manifest.versionCode = versionCode;

    return true;
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

    // Update versionCode in AndroidManifest.xml
    this.updateVersionCode(abi);

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
 * Apply icon if none yet, or source has higher quality
 * @param {String} srcPath Icon to apply
 * @param {String} dstDir Path to destination directory
 * @param {String} iconFilename Destination icon filename without extension
 * @param {Function} callback Error callback
 * @returns {Boolean} True if applied, otherwise false.
 */
AndroidPlatform.prototype.applyIcon =
function(srcPath, dstDir, iconFilename, callback) {

    var output = this.application.output;

    // Different image types get different priorities.
    var score = {
        "png": 3,
        "jpeg": 2,
        "jpg": 2,
        "gif": 1
    };

    // extname() includes the ".", so strip it
    var srcExt = Path.extname(srcPath);
    if (srcExt && srcExt[0] === ".")
        srcExt = srcExt.substring(1);

    var srcScore = score[srcExt.toLowerCase()];
    if (!srcScore) {
        output.warning("Image type not supported: " + srcPath);
        return false;
    }

    // Replace existing icon if we have a better one.
    var curPath = null;
    var curScore = -1;
    var ls = ShellJS.ls(Path.join(dstDir, iconFilename + "*"));
    if (ls.length > 1) {
        output.warning("Unexpected extra files in " + dstDir);
    }
    if (ls.length > 0) {

        // extname() includes the ".", so strip it
        curPath = ls[0];
        var curExt = Path.extname(curPath);
        if (curExt && curExt[0] === ".")
            curExt = curExt.substring(1);

        curScore = +score[curExt.toLowerCase()];
    }

    if (srcScore >= curScore) {
        if (curPath) {
            // We have found a better quality icon
            ShellJS.rm(curPath);
        }
        var dstPath = Path.join(dstDir, iconFilename + Path.extname(srcPath));
        ShellJS.cp(srcPath, dstPath);
    }

    return true;
};

/**
 * Update launcher icons.
 * @param {AndroidManifest} androidManifest
 * @param {Function} callback Error callback
 */
AndroidPlatform.prototype.updateIcons =
function(androidManifest, callback) {

    var output = this.application.output;

    // See http://iconhandbook.co.uk/reference/chart/android/
    var sizes = {
        "ldpi": 36,
        "mdpi": 48,
        "hdpi": 72,
        "xhdpi": 96,
        "xxhdpi": 144,
        "xxxhdpi": 192,
        match: function(size) {

            // Default to "hdpi", android will scale.
            if (size === "any")
                return "hdpi";

            // Match size as per categories above.
            for (var prop in this) {
                if (this[prop] <= size) {
                    return prop;
                }
            }
            return "xxxhdpi";
        }
    };

    var nUpdated = 0;
    var iconFilename = "crosswalk_icon";

    // Add icons from manifest
    var icons = this.application.manifest.icons;
    if (icons && icons.length > 0) {

        // Remove existing icons, so we don't have stale ones around
        // FIXME check that no icon was added manually.
        ShellJS.rm("-rf", Path.join(this.platformPath, "res", "mipmap-*"));

        for (var i = 0; i < icons.length; i++) {

            var icon = icons[i];
            var size = icon.sizes ? +icon.sizes.split("x")[0] : "any";
            var density = sizes.match(size);

            // Copy icon into place
            // Icon will always be named crosswalk-icon.<ext>
            // Because android:icon has no way to refer to different sizes.
            var src = Path.join(this.appPath, icon.src);
            var dstPath = Path.join(this.platformPath, "res", "mipmap-" + density);
            ShellJS.mkdir(dstPath);

            var ret = this.applyIcon(src, dstPath, iconFilename, callback);
            if (ret)
                nUpdated++;
        }
    }

    if (nUpdated > 0) {
        androidManifest.applicationIcon = "@mipmap/" + iconFilename;
    } else {
        output.warning("No usable icons found in manifest.json");
        output.warning("Using builtin default icon");
        // Fall back to the default icon
        androidManifest.applicationIcon = "@drawable/crosswalk";
    }

    return nUpdated;
};

/**
 * Update android manifest.
 * @param {Function} callback Error callback
 */
AndroidPlatform.prototype.updateManifest =
function(callback) {

    var output = this.application.output;

    var manifest = new AndroidManifest(output,
                                       Path.join(this.platformPath, "AndroidManifest.xml"));

    // Renaming package is not supported.
    if (manifest.package !== this.application.manifest.packageId) {
        callback("Renaming of package not supported (" +
                 manifest.package + "/" + this.application.manifest.packageId + ")");
        return;
    }

    manifest.versionName = this.application.manifest.appVersion;
    manifest.applicationLabel = this.application.manifest.name;

    // Update icons
    this.updateIcons(manifest, callback);
};

/**
 * Update java activity file for build config.
 * @param {Boolean} release True if release build, false if debug
 * @returns {Boolean} True if successful, otherwise false.
 */
AndroidPlatform.prototype.updateJavaActivity =
function(release) {

    var output = this.application.output;
    var ret = true;

    // Update java
    var config = release ? "release" : "debug";
    output.info("Updating java activity for '" + config + "' configuration");

    var dir = JavaActivity.pathForPackage(this.platformPath, this.packageId);
    var path = Path.join(dir, "MainActivity.java");
    var activity = new JavaActivity(output, path);

    // Enable remote debugging for debug builds.
    ret = activity.enableRemoteDebugging(!release);
    if (!ret)
        return false;

    // Animatable view
    ret = activity.enableAnimatableView(this.application.manifest.androidAnimatableView);
    if (!ret)
        return false;

    // Fullscreen
    var fullscreen = this.application.manifest.display === "fullscreen";
    ret = activity.enableFullscreen(fullscreen);
    if (!ret)
        return false;
    output.info("Updating theme.xml for display mode (fullscreen: " + (fullscreen ? "yes" : "no") + ")");
    var theme = new XmlTheme(output,
                             Path.join(this.platformPath, "res", "values-v14", "theme.xml"));
    theme.fullscreen = fullscreen;

    // "Keep screen on"
    ret = activity.enableKeepScreenOn(this.application.manifest.androidKeepScreenOn);
    if (!ret)
        return false;

    return ret;
};

/**
 * Implements {@link PlatformBase.build}
 */
AndroidPlatform.prototype.build =
function(configId, args, callback) {

    var output = this.application.output;

    // TODO should we cd back afterwards?
    process.chdir(this.platformPath);

    this.updateManifest(callback);
    this.updateJavaActivity(configId === "release");

    var closure = {
        abis: ["armeabi-v7a", "x86"], // TODO export option
        abiIndex : 0,
        release: configId == "release", // TODO verify above
        apks: [],
        callback: function(errormsg) {

            if (!errormsg &&
                closure.apks.length > 0) {

                output.highlight("  * Built package(s):");

                for (var i = 0; i < closure.apks.length; i++) {

                    // Export APKs to package folder
                    var packagePath = Path.join(this.platformPath, "bin", closure.apks[i]);
                    this.exportPackage(packagePath);

                    output.highlight("    + " + closure.apks[i]);
                }
            }
            callback(errormsg);
        }.bind(this)
    };

    // This builds all ABIs in a recursion (of sorts).
    this.buildABI(closure);
};

module.exports = AndroidPlatform;
