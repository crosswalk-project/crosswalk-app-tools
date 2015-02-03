// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');

// Test involves progress output, make it visible.
require("../src/Config").setSilentConsole(false);
var Console = require("../src/Console");
var AndroidProjectDeps = require("../src/AndroidProjectDeps");

var _application = require("../src/Application");

exports.tests = {

    fetchVersions: function(test) {

        test.expect(2);

        var deps = new AndroidProjectDeps(_application, "stable");
        deps.fetchVersions(function(versions, errormsg) {

            if (errormsg)
                Console.log(errormsg);

            test.equal(versions instanceof Array, true);
            test.equal(versions.length > 0, true);
            test.done();
        });
    },

    download: function(test) {

        test.expect(2);

        var deps = new AndroidProjectDeps(_application, "stable");
        deps.download("9.38.208.10", OS.tmpDir(), function(filename, errormsg) {

            if (errormsg)
                Console.log(errormsg);

            test.equal(typeof filename === "string", true);
            test.equal(filename.length > 0, true);
            test.done();
        });
    }
};
