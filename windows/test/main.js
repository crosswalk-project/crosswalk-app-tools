// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var ShellJS = require("shelljs");

var Application = require("../../src/Application");
var Util = require("../../test-util/Util.js");

var _packageId = "com.example.foo";

exports.tests = {

    main: function(test) {

        test.expect(1);

        // Just call main without args, this should display help.
        // Need to strip extra command-line args though, so the
        // command parser is not confused.
        process.argv = process.argv.slice(0, 2);

        // As long as no exception hits us we're good.
        var app = require("../../src/Main");
        app.run(function (errno) {
            test.equal(errno, 0);
            test.done();
        });
    },

    create: function(test) {

        test.expect(1);
        
        // Good test.
        var tmpdir = Util.createTmpDir();
        ShellJS.pushd(tmpdir);

        var app = require("../../src/Main");
        Application.call(app, tmpdir, _packageId);
        app.create(_packageId, {platform: "windows"}, function(errno) {

            test.equal(errno, 0);

            ShellJS.popd();
            ShellJS.rm("-rf", tmpdir);

            test.done();
        });
    }
};
