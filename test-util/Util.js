// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');
var Path = require('path');

var MkTemp = require('mktemp');
var ShellJS = require("shelljs");

function Util() {}

Util.prototype.ensureTestRoot =
function() {

    var rootPath = Path.normalize(__dirname + Path.sep + ".." + Path.sep + "test-tmp");
    if (!ShellJS.test("-d", rootPath)) {
        ShellJS.mkdir(rootPath);
    }

    if (ShellJS.test("-d", rootPath)) {
        return rootPath;
    }

    return null;
};

Util.prototype.makeTmpDir =
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

Util.prototype.makeTmpFile =
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

module.exports = new Util();
