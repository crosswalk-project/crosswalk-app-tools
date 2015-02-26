// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require("path");

var ShellJS = require("shelljs");

var Application = require("../src/Application");
var LogfileOutput = require("../src/LogfileOutput");
var PlatformBase = require("../src/PlatformBase");
var Util = require("../test-util/Util");

var _packageId = "com.example.foo";
var _platformId = "test";

function TestPlatform(data) {
    PlatformBase.call(this, data);
}
TestPlatform.prototype = PlatformBase.prototype;

exports.tests = {

    ctor: function(test) {

        test.expect(8);

        var basePath = Util.createTmpDir();
        var application = new Application(basePath, _packageId);

        var platformData = {
            application: application,
            platformId: _platformId
        };
        var platform = new TestPlatform(platformData);

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
    }
};
