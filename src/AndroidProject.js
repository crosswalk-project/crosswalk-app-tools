// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require('path');
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
    var tpl = new TemplateFile(__dirname + Path.sep +
                               ".."+ Path.sep +
                               "data" + Path.sep +
                               "build.xml.tpl");
    tpl.render(data, path + Path.sep + "build.xml");

    // project.properties
    var tpl = new TemplateFile(__dirname + Path.sep +
                               ".."+ Path.sep +
                               "data" + Path.sep +
                               "project.properties.tpl");
    tpl.render(data, path + Path.sep + "project.properties");

    // MainActivity.java
    var tpl = new TemplateFile(__dirname + Path.sep +
                               ".."+ Path.sep +
                               "data" + Path.sep +
                               "MainActivity.java.tpl");
    var activityPath = path + Path.sep +
                       "src" + Path.sep +
                       parts.join(Path.sep);
    tpl.render(data, activityPath + Path.sep + "MainActivity.java");

    return true;
};

/**
 * Implements {@link Project.generate}
 */
AndroidProject.prototype.generate =
function(packageId, callback) {

    var minApiLevel = 14;
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

            Console.log("Project template created at '" + path + "'");

            this.generateTemplates(packageId, apiTarget, path);

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
