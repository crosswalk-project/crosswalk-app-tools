// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var PlatformBase = require("../src/PlatformBase");
var PlatformInfo = require("../src/PlatformInfo");
var PlatformsManager = require("../src/PlatformsManager");

var _output = require("../src/TerminalOutput").getInstance();

exports.tests = {

    buildInfo: function(test) {

        test.expect(1);

        var mgr = new PlatformsManager(_output);
        var platformInfo = mgr.loadDefault();
        test.equal(platformInfo instanceof PlatformInfo, true);

        test.done();
    },

    loadAll: function(test) {

        test.expect(1);

        var mgr = new PlatformsManager(_output);
        var backends = mgr.loadAll();
        test.equal(backends.length > 0, true);

        test.done();
    }
};
