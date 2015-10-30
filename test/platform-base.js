// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require("path");

var ShellJS = require("shelljs");

var Application = require("../src/Application");
var LogfileOutput = require("../src/LogfileOutput");
var PlatformBase = require("../src/PlatformBase");
var PlatformInfo = require("../src/PlatformInfo");
var PlatformsManager = require("../src/PlatformsManager");

var TestPlatform = require("../test-util/TestPlatform");
var Util = require("../test-util/Util.js");

var _packageId = "com.example.foo";
var _platformId = "test";

exports.tests = {

    ctor: function(test) {

        test.expect(9);

        var basePath = Util.createTmpDir();
        var application = new Application(basePath, _packageId);
        var mgr = new PlatformsManager(application.output);

        var platformInfo = new PlatformInfo(TestPlatform, _platformId);

        var platformData = {
            application: application,
            platformId: _platformId,
            argSpec: platformInfo.argSpec
        };
        var platform = new TestPlatform(PlatformBase, platformData);

        test.equal(platform.application instanceof Application, true);

        var createArgSpec = platform.argSpec.create;
        test.equal(typeof createArgSpec["--test-foo"], "string");

        test.equal(platform.appPath, Path.join(basePath, _packageId, "app"));
        test.equal(platform.logOutput instanceof LogfileOutput, true);
        test.equal(platform.packageId, _packageId);
        test.equal(platform.pkgPath, process.cwd());
        test.equal(platform.platformId, _platformId);
        test.equal(platform.platformPath, Path.join(basePath, _packageId, "prj", _platformId));
        test.equal(platform.prjPath, Path.join(basePath, _packageId, "prj"));

        ShellJS.rm("-rf", basePath);

        test.done();
    },

    subclass: function(test) {

        test.expect(2);

        var basePath = Util.createTmpDir();
        var application = new Application(basePath, _packageId);

        var platformData = {
            application: application,
            platformId: _platformId
        };
        var platform = new TestPlatform(PlatformBase, platformData);

        platform.create(_platformId, null, function(errormsg) {
            test.equal(errormsg, null);
        });

        platform.build("debug", null, function(errormsg) {
            test.equal(errormsg, null);
        });

        ShellJS.rm("-rf", basePath);

        test.done();
    }
};
