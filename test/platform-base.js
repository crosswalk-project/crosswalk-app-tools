// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

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

        test.expect(3);

        var basePath = Util.createTmpDir();
        var application = new Application(basePath, _packageId);

        var platformData = {
            application: application,
            platformId: _platformId
        };
        var platform = new TestPlatform(platformData);

        test.equal(platform.application instanceof Application, true);
        test.equal(platform.platformId, _platformId);
        test.equal(platform.logOutput instanceof LogfileOutput, true);
        // TODO test for the other properties as well
        
        ShellJS.rm("-rf", basePath);

        test.done();
    }
};
