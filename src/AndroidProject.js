// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require('path');
var ShellJS = require("shelljs");
var AndroidSDK = require("./AndroidSDK");
var Console = require("./Console");
var Project = require("./Project");
var TemplateFile = require("./TemplateFile");

/**
 * Android project class.
 * @throws {@link AndroidSDK~SDKNotFoundError} If the Android SDK was not found in the environment.
 * @constructor
 */
function AndroidProject() {

    this._sdk = new AndroidSDK();
}
AndroidProject.prototype = Project;

AndroidProject.prototype.generateTemplates =
function(packageId, apiTarget, path) {

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
    tpl.render(data, path + Path.sep + "AndroidManifest.xml");

    // build.xml
    tpl = new TemplateFile(__dirname + Path.sep +
                               ".."+ Path.sep +
                               "data" + Path.sep +
                               "build.xml.tpl");
    tpl.render(data, path + Path.sep + "build.xml");

    // project.properties
    tpl = new TemplateFile(__dirname + Path.sep +
                               ".."+ Path.sep +
                               "data" + Path.sep +
                               "project.properties.tpl");
    tpl.render(data, path + Path.sep + "project.properties");

    // MainActivity.java
    tpl = new TemplateFile(__dirname + Path.sep +
                               ".."+ Path.sep +
                               "data" + Path.sep +
                               "MainActivity.java.tpl");
    var activityPath = path + Path.sep +
                       "src" + Path.sep +
                       parts.join(Path.sep);
    tpl.render(data, activityPath + Path.sep + "MainActivity.java");

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

    // Copy xwalk_core_library
    ShellJS.cp("-r",
               appTplPath + Path.sep + "xwalk_core_library",
               path);

    // Copy jars
    ShellJS.cp(appTplPath + Path.sep + "template" + Path.sep + "libs" + Path.sep + "*.jar",
               path + Path.sep + "libs");

    // Copy res
    ShellJS.cp("-rf",
               appTplPath + Path.sep + "template" + Path.sep + "res",
               path);

    // Make html5 app dir and copy sample content
    ShellJS.mkdir("-p", path + Path.sep + "assets");
    ShellJS.cp("-r",
               __dirname + Path.sep + ".."+ Path.sep + "data" + Path.sep + "www",
               path + Path.sep + "assets");

    return true;
};

/**
 * Implements {@link Project.generate}
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

        this._sdk.generateProjectTemplate(packageId, apiTarget,
                                          function(path, logmsg, errormsg) {

            if (!path || errormsg) {
                callback(errormsg);
                return;
            }

            var ret = this.generateTemplates(packageId, apiTarget, path);
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

AndroidProject.prototype.build =
function() {

    // TODO implement
};

module.exports = AndroidProject;
