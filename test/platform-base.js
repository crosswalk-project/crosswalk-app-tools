// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require("path");

var ShellJS = require("shelljs");

var Application = require("../src/Application");
var LogfileOutput = require("../src/LogfileOutput");

var TestPlatformScope = require("../test-util/TestPlatform");
var Util = require("../test-util/Util.js");

var _packageId = "com.example.foo";
var _platformId = "test";

exports.tests = {

    ctor: function(test) {

        test.expect(8);

        var basePath = Util.createTmpDir();
        var application = new Application(basePath, _packageId);

        var platformData = {
            application: application,
            platformId: _platformId
        };
        var PlatformBase = require("../src/PlatformBase");
        var platform = new TestPlatformScope(PlatformBase, platformData);

        test.equal(platform.application instanceof Application, true);
        test.equal(platform.appPath, Path.join(basePath, _packageId, "app"));
        test.equal(platform.logOutput instanceof LogfileOutput, true);
        test.equal(platform.packageId, _packageId);
        test.equal(platform.pkgPath, Path.join(basePath, _packageId, "pkg"));
        test.equal(platform.platformId, _platformId);
        test.equal(platform.platformPath, Path.join(basePath, _packageId, "prj", _platformId));
        test.equal(platform.prjPath, Path.join(basePath, _packageId, "prj"));

        ShellJS.rm("-rf", basePath);

        test.done();
    },

    subclass: function(test) {

        test.expect(4);

        var basePath = Util.createTmpDir();
        var application = new Application(basePath, _packageId);

        var platformData = {
            application: application,
            platformId: _platformId
        };
        var PlatformBase = require("../src/PlatformBase");
        var platform = new TestPlatformScope(PlatformBase, platformData);

        platform.generate(null, function(errormsg) {
            test.equal(errormsg, null);
        });

        platform.update(function(errormsg) {
            test.equal(errormsg, null);
        });

        platform.refresh(function(errormsg) {
            test.equal(errormsg, null);
        });

        platform.build(["foo"], false, function(errormsg) {
            test.equal(errormsg, null);
        });

        ShellJS.rm("-rf", basePath);

        test.done();
    }
};
