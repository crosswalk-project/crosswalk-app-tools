// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var ChildProcess = require("child_process");
var FS = require("fs");
var Path = require('path');

var FormatJson = require("format-json");
var MkTemp = require('mktemp');
var ShellJS = require("shelljs");

var AndroidManifest = require("./AndroidManifest");
var AndroidSDK = require("./AndroidSDK");
var JavaActivity = require("./JavaActivity");
var ProjectProperties = require("./ProjectProperties");
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
    instance._lite = false;
    instance._shared = false;
    instance._apiTarget = null;

    return instance;
}

/**
 * Minimal API level.
 * FIXME: this is not the optimal way to specify this.
 */
AndroidPlatform.MIN_API_LEVEL = 21;

/**
 * Accessor function for platform-specific command-line argument spec.
 * @static
 */
AndroidPlatform.getArgs =
function() {
    return {
        create: {
            "crosswalk": "                 Channel name (stable/beta/canary)\n" +
                         "\t\t\t\t\t\tor version number (w.x.y.z)\n" +
                         "\t\t\t\t\t\tor crosswalk zip\n" +
                         "\t\t\t\t\t\tor xwalk_app_template dir",
            "lite": "                      Use crosswalk-lite, see Crosswalk Wiki for details",
            "shared": "                    Depend on shared crosswalk installation",
            "targets": "                   Target ABIs to create"
        },
        build: {
            "targets": "                   Target ABIs to build"
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
        "java",
        "lzma"
    ];

    var found = true;
    var msg;

    deps.forEach(function (dep) {
        var path = ShellJS.which(dep);
        msg = "Checking for " + dep + "...";
        if (path) {
            output.info(msg, path);
        } else {
            found = false;
            output.error(msg + " " + path);
        }
    });

    // Checking env
    var androidHome = "ANDROID_HOME";
    msg = "Checking for " + androidHome + "...";
    if (process.env[androidHome]) {
        output.info(msg, process.env[androidHome]);
    } else {
        found = false;
        output.info(msg + " empty");
        output.error(androidHome + " needs to be set for builds to work");
    }

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
    output.info("Testing dummy project in", path);

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

    sdk.queryTarget(AndroidPlatform.MIN_API_LEVEL,
                    function(apiTarget, errormsg) {

        if (errormsg) {
            callback(errormsg);
            return;
        }

        sdk.generateProjectSkeleton(path, dummyPackageId, apiTarget,
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
    });
};

/**
 * Fill template files and put them into the project skeleton.
 * @param {String} apiTarget Android API target (greater android-14)
 * @param {String} activityClassName Class ame for the Activity
 * @returns {Boolean} True on success.
 */
AndroidPlatform.prototype.fillTemplates =
function(apiTarget, activityClassName) {

    // Namespace util
    var util = this.application.util;

    var parts = this.packageId.split('.');
    var packageName = parts[parts.length - 1];
    var data = {
        "packageId" : this.packageId,
        "packageName" : this.packageId,
        "activityName": this.packageId + "." + activityClassName,
        "apiTarget" : apiTarget,
        "xwalkLibrary" : this._shared ? "xwalk_shared_library" : "xwalk_core_library"
    };

    // AndroidManifest.xml
    var tpl = new util.TemplateFile(Path.join(__dirname, "..", "data", "AndroidManifest.xml.tpl"));
    tpl.render(data, this.platformPath + Path.sep + "AndroidManifest.xml");

    // build.xml
    tpl = new util.TemplateFile(Path.join(__dirname, "..", "data", "build.xml.tpl"));
    tpl.render(data, this.platformPath + Path.sep + "build.xml");

    // project.properties
    tpl = new util.TemplateFile(Path.join(__dirname, "..", "data", "project.properties.tpl"));
    tpl.render(data, this.platformPath + Path.sep + "project.properties");

    // Make html5 app dir and copy sample content
    var wwwPath = Path.join(this.platformPath, "assets", "www");
    ShellJS.mkdir("-p", wwwPath);
    ShellJS.cp("-rf", this.appPath + Path.sep + "*", wwwPath);

    // TODO check for errors
    return true;
};

/**
 * Import Crosswalk libraries and auxiliary files into the project.
 * @param {String} crosswalkPath Location of Crosswalk zip or xwalk_app_template build dir
 * @param {String} activityClassName Class ame for the Activity
 * @returns {String} Imported version on success, otherwise null.
 */
AndroidPlatform.prototype.importCrosswalkFromDisk =
function(crosswalkPath, activityClassName) {

    // Namespace util
    var util = this.application.util;

    var output = this.application.output;

    // "  * Extracting /home/robsta/Devel/tmp/crosswalk/crosswalk-15.44.384.12.zip [##########]"
    // Windows breaks at > 78.
    // Length of decorations/text is 28, so max length of path is 78-28,
    // minus nother 3 for ellipsis is 47.
    var indicator;
    if (crosswalkPath.length > 47) {
        var abbrv = crosswalkPath.substring(crosswalkPath.length - 47);
        indicator = output.createFiniteProgress("Extracting ..." + abbrv);
    } else {
        indicator = output.createFiniteProgress("Extracting " + crosswalkPath);
    }

    // Extract contents
    var xwalk = null;
    try {
        if (ShellJS.test("-d", crosswalkPath)) {
            xwalk = new util.CrosswalkDir(crosswalkPath);
        } else {
            xwalk = new util.CrosswalkZip(crosswalkPath);
        }
    } catch (e) {
        // HACK we're in the midst of a progress display, force line break
        output.write("\n");
        output.error("Failed to read " + crosswalkPath);
        if (ShellJS.test("-f", crosswalkPath)) {
            // Remove incomplete/corrupted zip so next time we start over downloading.
            ShellJS.rm("-f", crosswalkPath);
            output.error("Invalid file has been deleted, please try again");
        }
        return null;
    }

    indicator.update(0.2);

    if (xwalk.version.major < 9) {
        output.error("Crosswalk version " + xwalk.version.major + " not supported. Use 8+.");
        return null;
    } else if (xwalk.version.major < 17) {
        output.error("This version can't support Crosswalk " + xwalk.version.major + ". Please use previous version of this tool.");
        return null;
    } else if (xwalk.version.major > 19) {
        output.warning("This tool has not been tested with Crosswalk " + xwalk.version.major + ".");
    }

    var entry = xwalk.getEntry(xwalk.root);
    if (!entry) {
        output.error("Failed to find root entry " + xwalk.root);
        return null;
    }

    indicator.update(0.4);

    // Extract xwalk_core_library or xwalk_shared_library
    var path;
    var xwalkLibrary = this._shared ?
                            "xwalk_shared_library" :
                            "xwalk_core_library";
    var name = xwalk.root + xwalkLibrary + "/";
    entry = xwalk.getEntry(name);
    if (entry) {
        path = Path.join(this.platformPath, xwalkLibrary);
        xwalk.extractEntryTo(entry, path);
    } else {
        output.error("Failed to find entry " + name);
        return null;
    }

    indicator.update(0.5);

    // Update project properties
    var props = new ProjectProperties(Path.join(this.platformPath, "project.properties"), output);
    props.androidLibraryReference1 = xwalkLibrary;

    props = new ProjectProperties(Path.join(this.platformPath, xwalkLibrary, "project.properties"), output);
    props.target = this._apiTarget;

    indicator.update(0.6);

    name = xwalk.root + "template/libs/xwalk_app_runtime_java.jar";
    entry = xwalk.getEntry(name);
    if (entry) {
        xwalk.extractEntryTo(entry, this.platformPath + Path.sep + "libs");
    } else {
        output.error("Failed to find entry " + name);
        return null;
    }

    indicator.update(0.7);

    // Extract main activity java file
    name = xwalk.root + "template/src/org/xwalk/app/template/AppTemplateActivity.java";
    entry = xwalk.getEntry(name);
    if (entry) {

        // Create path
        var activityDirPath = JavaActivity.pathForPackage(this.platformPath, this.packageId);
        ShellJS.mkdir("-p", activityDirPath);
        if (!ShellJS.test("-d", activityDirPath)) {
            output.error("Failed to create activity dir " + activityDirPath);
            return false;
        }

        var activity = new JavaActivity(output,
                                        Path.join(activityDirPath, activityClassName + ".java"));
        if (!activity.importFromZip(entry, this.packageId, activityClassName))
            return null;

    } else {
        output.error("Failed to find in crosswalk release: " + name);
        return null;
    }

    indicator.update(0.8);

    // Extract res
    name = xwalk.root + "template/res/";
    entry = xwalk.getEntry(name);
    if (entry) {
        xwalk.extractEntryTo(entry, this.platformPath + Path.sep + "res");
    } else {
        output.error("Failed to find entry " + name);
        return null;
    }

    indicator.update(1);
    indicator.done();

    return xwalk.version.toString();
};

/**
 * Split target APIs string
 * TODO this is no more needed after crosswalk-app deprecation
 */
AndroidPlatform.prototype.parseTargets =
function(targetsSpec) {

    if (typeof targetsSpec === "string") {
        return targetsSpec.split(" ").filter(function (value) {
            // Filter empty entries caused by extra whitespace.
            return value;
        });
    }

    return targetsSpec;
};

/**
 * Implements {@link PlatformBase.create}
 */
AndroidPlatform.prototype.create =
function(packageId, args, callback) {

    // Namespace util
    var util = this.application.util;
    var output = this.application.output;

    if (args.lite && args.shared) {
        callback("Options \"lite\" and \"shared\" can not be used together");
        return;
    }

    if (args.lite) {
        this._lite = true;
    }

    if (args.shared) {
        this._shared = true;
    }

    // TODO this is no more needed after crosswalk-app deprecation
    args.targets = this.parseTargets(args.targets);

    // Check that only same-size ABIs are requested.
    if (args.targets) {
        var wordSize = 0;
        args.targets.forEach(function (abi) {
            if (wordSize &&
                wordSize != util.Targets.ABI_WORDSIZE[abi]) {
                callback("Projects can only be created for same-size ABIs (" + args.targets.join(",") + ")");
                return;
            }
            wordSize = util.Targets.ABI_WORDSIZE[abi];
        });
    }

    this._sdk.queryTarget(AndroidPlatform.MIN_API_LEVEL,
                          function(apiTarget, errormsg) {

        if (errormsg) {
            callback(errormsg);
            return;
        }

        this._apiTarget = apiTarget;
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
            } else if (this._lite) {
                versionSpec = "canary"; //Lite only has canary release.
            } else {
                versionSpec = "stable";
                output.info("Defaulting to download channel " + versionSpec);
            }

            // Activity class name is the last part of the package-id
            // starting in caps, plus "Activity".
            // E.g. Package com.example.foo will get activity FooActivity.
            var activityClassName = this.application.manifest.packageId.split(".").pop();
            activityClassName = activityClassName[0].toUpperCase() + activityClassName.substring(1);
            activityClassName += "Activity";

            if (!this.fillTemplates(apiTarget, activityClassName)) {
                callback("Failed to initialise project templates");
                return;
            }

            var deps = new util.Download01Org(this.application, "android", "stable" /* FIXME this is just a placeholder */);
            if (this._lite) {
                deps.androidFlavor = "crosswalk-lite";
            }

            if (args.targets && args.targets.length > 0) {
                // We only handle ABIs with same word size in one create() call
                // so just check for the first one.
                var wordSize = util.Targets.ABI_WORDSIZE[args.targets[0]];
                deps.androidWordSize = wordSize;
            }
            deps.importCrosswalk(versionSpec,
                                 function(path) {
                                     return this.importCrosswalkFromDisk(path, activityClassName);
                                 }.bind(this),
                                 function(version, errormsg) {

                if (errormsg) {
                    output.error(errormsg);
                    callback("Creating project template failed");
                    return;
                }

                output.info("Project template created at", path);
                callback(null);
            }.bind(this));
        }.bind(this));
    }.bind(this));
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

    // There is no need to enable/disable various ABIs when building shared.
    // Only one APK is being built.
    if (this._shared) {
        return true;
    }

    var libsDir = "xwalk_core_library/libs";
    if (!ShellJS.test("-d", libsDir)) {
        output.error("This does not appear to be the root of a Crosswalk project.");
        return false;
    }

    var abiMatched = false;
    FS.readdirSync(libsDir).forEach(function (entry) {

        // This is a dir inside "libs", enable/disable depending
        // on which ABI we want.
        var libxwalkcore = Path.join(libsDir, entry, "libxwalkcore.so");
        var libxwalkcoreCompressed = Path.join(libsDir, entry, "libxwalkcoreCompressed.so");
        var libxwalkdummy = Path.join(libsDir, entry, "libxwalkdummy.so");
        if (!abi) {
            // No ABI passed, enable all of them, this is default
            // status of the project.
            ShellJS.mv(libxwalkcore + ".foo", libxwalkcore);
            ShellJS.mv(libxwalkcoreCompressed + ".foo", libxwalkcoreCompressed);
            ShellJS.mv(libxwalkdummy + ".foo", libxwalkdummy);
            abiMatched = true;
        } else if (abi === entry) {
            // enable
            ShellJS.mv(libxwalkcore + ".foo", libxwalkcore);
            ShellJS.mv(libxwalkcoreCompressed + ".foo", libxwalkcoreCompressed);
            ShellJS.mv(libxwalkdummy + ".foo", libxwalkdummy);
            abiMatched = true;
        } else {
            // disable
            ShellJS.mv(libxwalkcore, libxwalkcore + ".foo");
            ShellJS.mv(libxwalkcoreCompressed, libxwalkcoreCompressed + ".foo");
            ShellJS.mv(libxwalkdummy, libxwalkdummy + ".foo");
        }
    });

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
        "shared": 2, // use same as ARM, TODO check if correct.
        "armeabi-v7a": 2,
        "arm64-v8a": 3,
        "x86": 6,
        "x86_64": 7
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
        ShellJS.cp("-f", srcPath, dstPath);
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
            // Start from the biggest size, and pick the first
            // one where the icon is bigger or same.
            var keys = Object.keys(this);
            for (var k = keys.length - 1; k >= 0; k--) {
                var prop = keys[k];
                if (size >= this[prop]) {
                    return prop;
                }
            }
            // Default to smallest size when below 36.
            return "ldpi";
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

        // Make sure the icon is present.
        ShellJS.cp(Path.join(__dirname, "..", "..", "app-template", "icon.png"),
                   Path.join(this.platformPath, "res", "drawable-hdpi", "crosswalk.png"));
    }

    return nUpdated;
};

/**
 * Configure crosswalk runtime.
 */
AndroidPlatform.prototype.updateEngine =
function() {

    var output = this.application.output;

    // Write command-line params file.
    var path = Path.join(this.platformPath, "assets", "xwalk-command-line");

    if (this.application.manifest.commandLine) {
        // Write file.
        output.info("Writing command-line parameters file");
        var commandLine = "xwalk " + this.application.manifest.commandLine;
        FS.writeFileSync(path, commandLine);
    } else {
        // Delete file to make sure there's not a stale one
        ShellJS.rm(path);
    }
};

/**
 * Update android manifest.
 * @param {Function} callback Error callback
 * @returns {AndroidManifest}
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
        return null;
    }

    manifest.versionName = this.application.manifest.appVersion;
    manifest.applicationLabel = this.application.manifest.name;

    // Update icons
    this.updateIcons(manifest, callback);

    // Update orientation
    switch (this.application.manifest.orientation) {
    case "any":
        manifest.screenOrientation = "unspecified";
        break;
    case "natural":
        manifest.screenOrientation = "sensor";
        break;
    case "landscape":
        manifest.screenOrientation = "sensorLandscape";
        break;
    case "portrait":
        manifest.screenOrientation = "sensorPortrait";
        break;
    case "portrait-primary":
        manifest.screenOrientation = "portrait";
        break;
    case "portrait-secondary":
        manifest.screenOrientation = "reversePortrait";
        break;
    case "landscape-primary":
        manifest.screenOrientation = "landscape";
        break;
    case "landscape-secondary":
        manifest.screenOrientation = "reverseLandscape";
        break;
    default:
        output.warning("Unsupported orientation value in web manifest: " + this.application.manifest.orientation);
    }

    // Update permissions
    manifest.permissions = this.application.manifest.androidPermissions;

    return manifest;
};

/**
 * Update java activity file for build config.
 * @param {Boolean} release True if release build, false if debug
 * @param {String} activityClassName Class ame for the Activity
 * @returns {Boolean} True if successful, otherwise false.
 */
AndroidPlatform.prototype.updateJavaActivity =
function(release, activityClassName) {

    var output = this.application.output;
    var ret = true;

    // Update java
    var config = release ? "release" : "debug";
    output.info("Updating java activity for '" + config + "' configuration");

    var dir = JavaActivity.pathForPackage(this.platformPath, this.packageId);
    var path = Path.join(dir, activityClassName + ".java");
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

    // "Keep screen on"
    ret = activity.enableKeepScreenOn(this.application.manifest.androidKeepScreenOn);
    if (!ret)
        return false;

    return ret;
};

/**
 * Convert assets to webp format
 */
AndroidPlatform.prototype.updateWebApp =
function() {

    var output = this.application.output;

    // Always copy over the app tree to the android project
    var wwwPath = Path.join(this.platformPath, "assets", "www");
    ShellJS.rm("-rf", wwwPath + Path.sep + "*");
    output.info("Copying app to", wwwPath);
    ShellJS.cp("-rf", this.appPath + Path.sep + "*", wwwPath);

    var params = this.application.manifest.androidWebp;
    if (!params) {
        // No webp conversion needed.
        return;
    }

    output.info("Converting image assets to webp format (" + params + ")");

    // Check for conversion tool
    var cwebp = ShellJS.which("cwebp");
    output.info("Checking for cwebp ...", cwebp);
    if (!cwebp) {
        output.warning("Webp conversion tool not found, install from http://downloads.webmproject.org/releases/webp");
        output.warning("Webp conversion failed, packaging unconverted assets");
        return;
    }

    // Quality parameters
    var jpegQuality = 80;
    var pngQuality = 80;
    var pngAlphaQuality = 80;
    var argsList = [];
    if (typeof params === "string")
        argsList = params.split(/[ ,]+/);
    if (argsList && argsList.length > 0)
        jpegQuality = argsList[0];
    if (argsList && argsList.length > 1)
        pngQuality = argsList[1];
    if (argsList && argsList.length > 2)
        pngAlphaQuality = argsList[2];

    // Directory traversal function
    function walk(dir) {
        var results = [];
        var list = FS.readdirSync(dir);
        list.forEach(function(file) {
            file = dir + "/" + file;
            var stat = FS.statSync(file);
            if (stat && stat.isDirectory())
                results = results.concat(walk(file));
            else
                results.push(file);
        });
        return results;
    }

    // Do conversion
    var fileList = walk(wwwPath);
    var progress = output.createInfiniteProgress("Converting images to webp");
    for (var i in fileList) {
        if (FS.lstatSync(fileList[i]).isFile()) {
            var filePath = fileList[i];
            var tmpFilePath = filePath + ".webp";
            var ext = Path.extname(filePath);
            progress.update(filePath);
            if (".jpeg" == ext || ".jpg" == ext) {
                execSync(cwebp +
                         " " + filePath +
                         " -q " + jpegQuality +
                         " -o " + tmpFilePath);
                ShellJS.mv("-f", tmpFilePath, filePath);
            } else if (".png" == ext) {
                execSync(cwebp +
                         " " + filePath +
                         " -q " + pngQuality +
                         " -alpha_q " + pngAlphaQuality +
                         " -o " + tmpFilePath);
                ShellJS.mv("-f", tmpFilePath, filePath);
            }
        }
    }
    progress.done();

    var logOutput = this.logOutput;
    var execSyncImpl;
    function execSync(cmd) {

        // On first run, work out which implementation to use.
        if (typeof execSyncImpl === "undefined") {
            if (ChildProcess.execSync) {
                // Nodejs >= 0.12
                execSyncImpl = ChildProcess.execSync;
            } else {
                // Try to use npm module.
                try {
                    // Exec-sync does throw even though it works, so let's use this hack,
                    // it's just for nodejs 0.10 compat anyway.
                    execSyncImpl = function(cmd) { try { return require("exec-sync")(cmd); } catch (e) {} return null; };
                } catch (e) {
                    output.error("NPM module 'exec-sync' not found");
                    output.error("Please install this package manually when on nodejs < 0.12");
                    execSyncImpl = null;
                }
            }
        }

        if (execSyncImpl !== null) {
            var ret = execSyncImpl(cmd);
            if (ret) {
                logOutput.write(cmd + "\n" + ret + "\n");
            }
        }
    }
};

/**
 * Wrapper for ChildProcess.execSync to preserve some support for nodejs 0.10
 * This can probably go away with Fedora 23.
 */
AndroidPlatform.prototype.execSync =
function(cmd) {

    var execSyncImpl;
    if (ChildProcess.execSync) {
        // Nodejs >= 0.12
        execSyncImpl = ChildProcess.execSync;
    } else {
        // Try to use npm module.
        try {
            // Exec-sync does throw even though it works, so let's use this hack,
            // it's just for nodejs 0.10 compat anyway.
            execSyncImpl = function(cmd) { try { return require("exec-sync")(cmd); } catch (e) {} return null; };
        } catch (e) {
            output.error("NPM module 'exec-sync' not found");
            output.error("Please install this package manually when on nodejs < 0.12");
            execSyncImpl = null;
        }
    }

    if (execSyncImpl !== null) {
        return execSyncImpl(cmd);
    }

    return null;
};

/**
 * Import extensions.
 * The directory of one external extension should be like:
 *   myextension/
 *     myextension.jar
 *     myextension.js
 *     myextension.json
 * That means the name of the internal files should be the same as the
 * directory name.
 * For .jar files, they'll be copied to libs/ and then
 * built into classes.dex in the APK.
 * For .json/.js files, they'll be copied into assets/xwalk-extensions/myextension.
 */
AndroidPlatform.prototype.importExtensions =
function() {

    var output = this.application.output;

    var extensionsPerms = [];
    this.application.manifest.extensions.forEach(function (extPath) {

        // Test integrity
        if (!ShellJS.test("-d", extPath)) {
            output.warning("Skipping invalid extension dir " + extPath);
            return;
        }
        var extName = Path.basename(extPath);

        var jarPath = Path.join(extPath, extName + ".jar");
        if (!ShellJS.test("-f", jarPath)) {
            output.warning("Skipping extension, file not found " + jarPath);
            return;
        }

        var jsonPath = Path.join(extPath, extName + ".json");
        if (!ShellJS.test("-f", jsonPath)) {
            output.warning("Skipping extension, file not found " + jsonPath);
            return;
        }

        var extRootPath = Path.join(this.platformPath, "assets", "xwalk-extensions");
        var jsonDstPath = Path.join(extRootPath, extName);
        var jsonBuf = FS.readFileSync(jsonPath, {"encoding": "utf8"});
        var configJson = JSON.parse(jsonBuf);
        // jsapi is optional
        if (configJson.jsapi) {
            // Copy js
            var jsPath = Path.join(extPath, configJson.jsapi);
            if (!ShellJS.test("-f", jsPath)) {
                output.warning("Skipping extension, file not found " + jsPath);
                return;
            }
            ShellJS.mkdir(extRootPath);
            ShellJS.mkdir(jsonDstPath);
            ShellJS.cp("-f", jsPath, jsonDstPath);
        }

        // Copy json
        ShellJS.mkdir(extRootPath);
        ShellJS.mkdir(jsonDstPath);
        ShellJS.cp("-f", jsonPath, jsonDstPath);
        // Copy jar
        ShellJS.cp("-f", jarPath, Path.join(this.platformPath, "libs"));

        // Accumulate permissions
        for (var i = 0; configJson.permissions && i < configJson.permissions.length; i++) {
            var perm = configJson.permissions[i];
            // Support both android.permission.FOO namespaced and plain
            // version by using last component.
            perm = perm.split(".").pop();
            extensionsPerms.push(perm);
        }

    }.bind(this));

    // Add permissions to manifest, so they end up in AndroidManifest.xml later
    extensionsPerms.forEach(function (perm) {
        var perms = this.application.manifest.androidPermissions;
        if (perms.indexOf(perm) < 0) {
            perms.push(perm);
        }
    }.bind(this));
};

/**
 * Update app theme.
 * @param {AndroidManifest} androidManifest
 * @returns {Boolean} true on success.
 */
AndroidPlatform.prototype.updateXmlTheme =
function(androidManifest) {

    var output = this.application.output;

    var fullscreen = this.application.manifest.display === "fullscreen";
    output.info("Updating theme.xml for display mode (fullscreen: " + (fullscreen ? "yes" : "no") + ")");

    var theme = new XmlTheme(output,
                             Path.join(this.platformPath, "res", "values-v14", "theme.xml"));
    theme.fullscreen = fullscreen;

    // White is default, set colour if not white.
    var bgColor = this.application.manifest.backgroundColor;
    return theme.setSplash(bgColor, androidManifest.applicationIcon);
};

/**
 * Implements {@link PlatformBase.build}
 */
AndroidPlatform.prototype.build =
function(configId, args, callback) {

    var output = this.application.output;

    // TODO should we cd back afterwards?
    process.chdir(this.platformPath);

    // TODO this is no more needed after crosswalk-app deprecation
    args.targets = this.parseTargets(args.targets);

    // Embedded or shared build?
    var abis = [];
    var libPath = Path.join(this.platformPath, "xwalk_core_library", "libs");
    if (ShellJS.test("-d", Path.join(this.platformPath, "xwalk_shared_library"))) {
        this._shared = true;
        abis = [ "shared" ];

    } else if (!args.targets || args.targets.length === 0) {
        // Build all available ABIs
        ShellJS.ls(libPath).forEach(function (lib) {
            if (ShellJS.test("-d", Path.join(libPath, lib))) {
                abis.push(lib);
            }
        }.bind(this));

    } else if (args.targets.length > 0) {
        // Build specified target ABIs.
        args.targets.forEach(function (abi) {
            if (ShellJS.test("-d", Path.join(libPath, abi))) {
                abis.push(abi);
            } else {
                output.error("Failed to find libxwalkcore.so for " + abi + ", skipping");
            }
        });

    } else {
        callback("Failed to determine which ABIs to build");
        return;
    }

    this.updateEngine();
    this.importExtensions();
    var androidManifest = this.updateManifest(callback);
    if (!androidManifest) {
        // Callback already called from updateManifest
        return;
    }
    this.updateJavaActivity(configId === "release", androidManifest.activityClassName);
    this.updateWebApp(this.application.manifest.androidWebp);
    this.updateXmlTheme(androidManifest);

    var closure = {
        abis: abis,
        abiIndex : 0,
        release: configId == "release", // TODO verify above
        apks: [],
        callback: function(errormsg) {

            if (!errormsg &&
                closure.apks.length > 0) {

                for (var i = 0; i < closure.apks.length; i++) {

                    // Export APKs to package folder
                    var packagePath = Path.join(this.platformPath, "bin", closure.apks[i]);
                    this.exportPackage(packagePath);

                    output.highlight("Package: " + closure.apks[i]);
                }
                if (configId === "release") {
                    output.highlight("APKs need to be signed before publishing, see");
                    output.highlight("https://developer.android.com/tools/publishing/app-signing.html#signing-manually");
                }
            }
            callback(errormsg);
        }.bind(this)
    };

    // This builds all ABIs in a recursion (of sorts).
    this.buildABI(closure);
};

module.exports = AndroidPlatform;
