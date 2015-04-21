// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');
var Path = require('path');

var MkTemp = require('mktemp');
var ShellJS = require("shelljs");

var Application = require("../src/Application");



function Util() {}

Util.prototype.ensureTestRoot =
function() {

    var rootPath = Path.join(__dirname, "..", "test-tmp");
    rootPath = Path.normalize(rootPath);
    if (!ShellJS.test("-d", rootPath)) {
        ShellJS.mkdir(rootPath);
    }

    if (ShellJS.test("-d", rootPath)) {
        return rootPath;
    }

    return null;
};

Util.prototype.createTmpDir =
function() {

    var tmpDir = null;

    var rootPath = this.ensureTestRoot();
    if (rootPath) {

        ShellJS.pushd(rootPath);
        var tmpDirName = MkTemp.createDirSync("XXXXXX");
        if (ShellJS.test("-d", tmpDirName)) {
            tmpDir = rootPath + Path.sep + tmpDirName;
        }
        ShellJS.popd();
    }

    return tmpDir;
};

Util.prototype.createTmpFile =
function() {

    var tmpFile = null;

    var rootPath = this.ensureTestRoot();
    if (rootPath) {

        ShellJS.pushd(rootPath);
        var tmpFileName = MkTemp.createFileSync("XXXXXX");
        if (ShellJS.test("-f", tmpFileName)) {
            tmpFile = rootPath + Path.sep + tmpFileName;
        }
        ShellJS.popd();
    }

    return tmpFile;
};

Util.prototype.createTmpApplication =
function(packageId) {

    var basePath = this.createTmpDir();
    return new Application(basePath, packageId);
};

Util.prototype.deleteTmpApplication =
function(application) {

    var basePath = Path.dirname(application.rootPath);
    ShellJS.rm("-rf", basePath);
};

module.exports = new Util();
