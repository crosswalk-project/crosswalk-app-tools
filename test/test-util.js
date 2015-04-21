// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');
var Path = require('path');

var MkTemp = require('mktemp');
var ShellJS = require("shelljs");

var Util = require("../test-util/Util.js");

var _test_util_projectRoot = Path.normalize(__dirname + Path.sep + "..");

exports.tests = {

    ensureTestRoot: function(test) {

        test.expect(2);

        var testRoot = Util.ensureTestRoot();
        test.equal(ShellJS.test("-d", testRoot), true);

        var commonRoot = testRoot.substring(0, _test_util_projectRoot.length);
        test.equal(commonRoot, _test_util_projectRoot);

        test.done();
    },

    createTmpDir: function(test) {

        test.expect(3);

        var tmpDir = Util.createTmpDir();
        test.equal(ShellJS.test("-d", tmpDir), true);

        var commonRoot = tmpDir.substring(0, _test_util_projectRoot.length);
        test.equal(commonRoot, _test_util_projectRoot);

        ShellJS.rm("-rf", tmpDir);
        test.equal(ShellJS.test("-d", tmpDir), false);

        test.done();
    },

    createTmpFile: function(test) {

        test.expect(3);

        var tmpFile = Util.createTmpFile();
        test.equal(ShellJS.test("-f", tmpFile), true);

        var commonRoot = tmpFile.substring(0, _test_util_projectRoot.length);
        test.equal(commonRoot, _test_util_projectRoot);

        ShellJS.rm("-rf", tmpFile);
        test.equal(ShellJS.test("-d", tmpFile), false);

        test.done();
    }
};
