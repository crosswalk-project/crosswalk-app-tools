// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var PlatformBase = require("../src/PlatformBase");
var PlatformInfo = require("../src/PlatformInfo");
var TestPlatform = require("../test-util/TestPlatform");

var Util = require("../test-util/Util.js");

var _output = require("../src/TerminalOutput").getInstance();

exports.tests = {

    args: function(test) {

        test.expect(2);

        var platformInfo = new PlatformInfo(TestPlatform, "test");

        var createArgs = platformInfo.argSpec.create;
        test.equal(typeof createArgs["--test-foo"], "string");
        test.equal(typeof createArgs["--test-bar"], "string");

        test.done();
    },

    env: function(test) {

        test.expect(1);

        var platformInfo = new PlatformInfo(TestPlatform, "test");

        var envSpec = platformInfo.envSpec;
        test.equal(envSpec.CROSSWALK_APP_TOOL_TEST_FOO !== null, true);

        test.done();
    },

    create: function(test) {

        test.expect(1);

        var platformInfo = new PlatformInfo(TestPlatform, "test");
        var application = Util.createTmpApplication("com.example.foo");

        var platform = platformInfo.create(application);
        test.equal(platform instanceof PlatformBase, true);

        Util.deleteTmpApplication(application);

        test.done();
    }
};
