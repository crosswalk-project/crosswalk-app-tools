// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var OS = require('os');

var ShellJS = require("shelljs");

var Download01Org = require("../src/util/Download01Org");
var Util = require("../test-util/Util.js");

var _output = require("../src/TerminalOutput").getInstance();


exports.tests = {

    fetchVersions: function(test) {

        test.expect(2);

        var app = Util.createTmpApplication("com.example.foo");
        var deps = new Download01Org(app, "stable");
        deps.fetchVersions(function(versions, errormsg) {

            if (errormsg)
                _output.info(errormsg);

            test.equal(versions instanceof Array, true);
            test.equal(versions.length > 0, true);
            Util.deleteTmpApplication(app);
            test.done();
        });
    },

    download: function(test) {

        test.expect(2);

        var app = Util.createTmpApplication("com.example.foo");
        var deps = new Download01Org(app, "stable");
        var tmpDir = Util.createTmpDir();
        deps.download("9.38.208.10", tmpDir, function(filename, errormsg) {

            if (errormsg)
                _output.info(errormsg);

            test.equal(typeof filename === "string", true);
            test.equal(filename.length > 0, true);
            ShellJS.rm("-rf", tmpDir);
            Util.deleteTmpApplication(app);
            test.done();
        });
    }
};
