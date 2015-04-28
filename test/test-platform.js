// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var PlatformBase = require("../src/PlatformBase");
var PlatformsManager = require("../src/PlatformsManager");
var TestPlatform = require("../test-util/TestPlatform");

var _output = require("../src/TerminalOutput").getInstance();

exports.tests = {

    buildInfo: function(test) {

        test.expect(3);

        var mgr = new PlatformsManager(_output);
        var platformInfo = mgr.buildInfo(TestPlatform, "test");

        var createArgs = platformInfo.argSpec.create;
        test.equal(typeof createArgs["--test-foo"], "string");
        test.equal(typeof createArgs["--test-bar"], "string");

        var updateArgs = platformInfo.argSpec.update;
        test.equal(typeof updateArgs["--test-baz"], "string");

        test.done();
    }
};
