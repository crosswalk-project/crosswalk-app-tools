var MODULE_NAME = 'RS_R200_DEP';

var builder = require('xmlbuilder');
var child_process = require('child_process');
var fs = require('fs');
var OS = require('os');
var Path = require('path');
var ShellJS = require('shelljs');
var uuid = require('node-uuid');

//TODO(Donna): create the URL according to the version.
var RS_RUNTIME_URL =
      'http://registrationcenter-download.intel.com/akdlm/irc_nas/8257/intel_rs_sdk_runtime_websetup_7.0.23.8048.exe';
var RS_LICENSE_URL = 'http://donna.bj.intel.com/rssdk/eula.rtf';
var FeatureNameMap = {
  'RS_R200_DEP': 'epv',
  'RS_R200_SP': 'scene_perception',
  'RS_R200_Face': 'face3d'
};

function RsRuntimePackagingHooks(app /* instance of Application.js */) {
  this._application = app;
  this._output = app.output;
  this._hooksTempPath = app.rootPath + Path.sep + "hooksTemp";
  ShellJS.mkdir(this._hooksTempPath);
  
  this._moduleNamesFile = this._hooksTempPath + Path.sep + "RS_MODULE_NAMES";
  this._postTaskLockFile = this._hooksTempPath + Path.sep + "POST_TASK_LOCK";
}

RsRuntimePackagingHooks.prototype.prePackage = function(callback) {
  fs.appendFileSync(this._moduleNamesFile, MODULE_NAME + ";");
  if (callback instanceof Function)
    callback(null);
};

RsRuntimePackagingHooks.prototype.postPackage = function(callback) {
  // Get the lock to do post work.
  if (ShellJS.test("-f", this._postTaskLockFile)) {
    return;
  }
  fs.closeSync(fs.openSync(this._postTaskLockFile, 'w'));

  // Get the generated msi file.
  var msiFile = this._application.generatedPackage;
  if (!ShellJS.test("-f", msiFile)) {
    this._output.error("Error: not msi found.");
    return;
  }

  // Get the needed modules, registerred by prePackage phase.
  var modules = fs.readFileSync(this._moduleNamesFile, "utf8");
  var length = modules.length;
  if (modules[length - 1] == ";") {
    modules = modules.substr(0, length - 1);
  }
  modules = modules.split(";");

  // Try to get the runtime installer.
  var runtimeFile = null;
  if (process.env.RS_RUNTIME_WEB_INSTALLER) {
    // TODO(Donna):
    // Get the the web installer
    // Create a correct commend line for the web installer
    // Bundle the installer with Application MSI
    if (ShellJS.test("-f", process.env.RS_RUNTIME_WEB_INSTALLER)) {
      runtimeFile = process.env.RS_RUNTIME_WEB_INSTALLER;
    }
  }
  if (process.env.RS_RUNTIME_OFFLINE_INSTALLER) {
    // TODO(Donna):
    // Create right pre-bundle command line according to the modules
    // Pre-bundle the installer, so that we can just include the needed modules.
    // Bundle the customized runtime with Application MSI with correct
    // command line options.
  }
  // If no environment variables we can use to can runtime installer, we need to
  // downdown the web installer from website and then bundle it with App MSI.
  this.downloadFromUrl(RS_LICENSE_URL, ".", function(licenseFile, errorMsg) {
    if (errorMsg) {
      callback(errorMsg);
      return;
    }
    if (ShellJS.test("-f", runtimeFile)) {
      this.bundleThemAll(msiFile, runtimeFile, modules, licenseFile, callback);
    }
    this.downloadFromUrl(RS_RUNTIME_URL, ".", function(runtimeFile, errorMsg) {
      this.bundleThemAll(msiFile, runtimeFile, modules, licenseFile, callback);
    }.bind(this));
  }.bind(this));
};

// Return name like:
// "intel_rs_sdk_runtime_websetup_7.0.23.6161.exe"
function buildFileName(url) {
  return Path.basename(url);
  /*
  var name = "intel_rs_sdk_runtime_";
  if (!offline)
    name = name + "websetup_";
  return name + version + ".exe";
  */
}

function getWindowsVersion(appVersion) {
  // WiX wants 4 component version numbers, so append as many ".0" as needed.
  // Manifest versions are restricted to 4 parts max.
  if (!appVersion || appVersion.length < 1)
    return '0.0.0.0';
  var nComponents = appVersion.split(".").length;
  var versionPadding = new Array(4 - nComponents + 1).join(".0");
  return appVersion + versionPadding;
}

// To be used for cmd line arguments.
function InQuotes(arg) {
  return "\"" + arg + "\"";
}
RsRuntimePackagingHooks.prototype.runWix =
function(basename, options, callback) {

    var candle = "candle " + options + " " + basename + ".wxs";
    this._output.info("Running '" + candle + "'");
    var child = child_process.exec(candle);

    child.stdout.on("data", function(data) {
        this.onData(data);
    }.bind(this));

    child.stderr.on("data", function(data) {
        this._output.warning(data);
    }.bind(this));

    child.on("exit", function(code, signal) {
        if (code) {
            this._output.error("Unhandled error " + code);
            callback(false);
        } else {
            this.runWixLight(basename, options, callback);
        }
        return;
    }.bind(this));
};

RsRuntimePackagingHooks.prototype.runWixLight =
function(basename, options, callback) {

    var light = "light " + options + " " + basename + ".wixobj";
    this._output.info("Running '" + light + "'");
    var child = child_process.exec(light);

    child.stdout.on("data", function(data) {
        this.onData(data);
    }.bind(this));

    child.stderr.on("data", function(data) {
        this._output.warning(data);
    }.bind(this));

    child.on("exit", function(code, signal) {
        if (code) {
            this._output.error("Unhandled error " + code);
        }
        callback(code === 0);
        return;
    }.bind(this));
};

RsRuntimePackagingHooks.prototype.onData =
function(data) {

};

RsRuntimePackagingHooks.prototype.selectIcon = function () {
    var output = this._output;
    var appPath = this._application.appPath;

    var icons = this._application.manifest.icons;
    var winIcon = null;
    if (icons && icons.length > 0) {
        for (var i = 0; i < icons.length; i++) {
            var icon = icons[i];
            var ext = Path.extname(icon.src).toLowerCase();
            if (ext === ".ico") {
                winIcon = icon.src;
                break;
            }
        }
    }

    if (winIcon) {
        winIcon = Path.join(appPath, winIcon);
    } else {
        output.warning("No icon in '.ico' format found in the manifest");
        output.warning("Using default crosswalk.ico");
        winIcon = Path.join(appPath, "crosswalk.ico");
        ShellJS.cp(Path.join(__dirname, "..", "..", "app-template", "crosswalk.ico"), winIcon);
    }

    return winIcon;
};
RsRuntimePackagingHooks.prototype.bundleThemAll =
function(msiFile, runtimeFile, modules, licenseFile, callback) {
  this._output.info("Create a bundle with following files:");
  this._output.info("msiFile:" + msiFile);
  this._output.info("modules:" + modules);
  this._output.info("runtimeFile:" + runtimeFile);
  this._output.info("licenseFile:" + licenseFile);
  var root = builder.create('Wix').att('xmlns', 'http://schemas.microsoft.com/wix/2006/wi');
  root.att('xmlns:bal', 'http://schemas.microsoft.com/wix/BalExtension');
  var version = getWindowsVersion(this._application.manifest.appVersion);
  var bundle = root.ele('Bundle', {
      'Version': version,
      'IconSourceFile': this.selectIcon(),
      'UpgradeCode': uuid.v1()
  });
  var bootStrapper = bundle.ele('BootstrapperApplicationRef', {
      'Id': 'WixStandardBootstrapperApplication.RtfLargeLicense'
  });
  bootStrapper.ele('bal:WixStandardBootstrapperApplication', {
      'LicenseFile': licenseFile,
      'ShowVersion': 'yes'
  });
  var chain = bundle.ele('Chain');
  chain.ele('ExePackage', {
      'SourceFile': runtimeFile,
      'InstallCommand': getRuntimeCmdOptions(modules)
  });
  chain.ele('RollbackBoundary');
  chain.ele('MsiPackage', {
      'SourceFile': msiFile,
      'ForcePerMachine': 'yes',
      'Vital':'yes'
  });
  var xml_str = root.end({ pretty: true });
  var basename = this._application.manifest.packageId + "-RS-RT-Bundle-" + version;
  fs.writeFileSync(basename + '.wxs', xml_str);
  var wixOptions = '-v -ext WixBalExtension';
  this.runWix(InQuotes(basename), wixOptions, function(success) {
    if (success) {
      //TODO(Donna): Should we exposePackagedFile like the original
      //             process of msi file?
      // Pass back built package
      //meta_data.msi = path.resolve(basename + ".msi");

      // Only delete on success, for debugging reasons.
      //Move the files to hooksTempDir in case the "-k" option was used.
      ShellJS.mv("-f", basename + ".wxs", this._hooksTempPath);
      ShellJS.mv("-f", basename + ".wixobj", this._hooksTempPath);
      ShellJS.mv("-f", basename + ".wixpdb", this._hooksTempPath);
    }
    if (callback instanceof Function)
      callback(success);
  }.bind(this));
}; 

function getRuntimeCmdOptions(modules) {
  var features = ' --silent --no-progress --acceptlicense=yes'
                 + ' --fnone=all --finstall=';
  modules.forEach(function(m, i) {
    if (FeatureNameMap.hasOwnProperty(m)) {
      features += FeatureNameMap[m];
      features += ',';
    }
  });
  features += 'core,vs_rt_2012';
  return features;
}
/**
 * Download file from a URL, checks for already existing file,
 * and returns it in case.
 * @param {String} url runtime URL string
 * @param {String} defaultPath Directory to download to if not already exists
 * @param {downloadFinishedCb} callback callback function
 * @throws {FileCreationFailed} If download file could not be written.
 */
RsRuntimePackagingHooks.prototype.downloadFromUrl = function(url, defaultPath, callback) {
  // Namespaces
  var util = this._application.util;

  var fileName = buildFileName(url);
  
  // Check for existing download in defaultPath, parent dir, and cache dir if set
  var handler = new util.DownloadHandler(defaultPath, fileName);
  var localDirs = [defaultPath, ""];
  if (process.env.RS_RUNTIME_CACHE_DIR)
    localDirs.push(process.env.RS_RUNTIME_CACHE_DIR);
  var localPath = handler.findLocally(localDirs);
  if (localPath) {
    this._output.info("Using cached", localPath);
    callback(localPath);
    return;
  }

  // Download
  var label = "Downloading '" + url;
  var indicator = this._output.createFiniteProgress(label);

  var stream = handler.createStream();
  var downloader = new util.Downloader(url, stream);
  downloader.progress = function(progress) {
    indicator.update(progress);
  };
  downloader.get(function(errormsg) {
    indicator.done("");

    if (errormsg) {
      callback(null, errormsg);
    } else {
      var finishedPath = handler.finish(process.env.RS_RUNTIME_CACHE_DIR);
      callback(finishedPath);
    }
  });
};
module.exports = RsRuntimePackagingHooks;
