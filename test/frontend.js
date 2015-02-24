// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require('path');
var ShellJS = require("shelljs");

var Frontend = require("../src/Frontend");
var LogfileOutput = require("../src/LogfileOutput");
var TerminalOutput = require("../src/TerminalOutput");
var Util = require("../test-util/Util");

var _application = require("../src/Main");

exports.tests = {

    frontend: function(test) {

        test.expect(8);

        var tmpDir = Util.createTmpDir();
        var packageId = "com.example.foo";
        var platformId = "android";

        // Set up project skeleton.
        // The Frontend assumes the basic project layout to exist.
        var baseDir = tmpDir + Path.sep + packageId;
        ShellJS.mkdir(baseDir);

        var appDir = baseDir + Path.sep + "app"
        ShellJS.mkdir(appDir);

        var pkgDir = baseDir + Path.sep + "pkg"
        ShellJS.mkdir(pkgDir);

        var logDir = baseDir + Path.sep + "log"
        ShellJS.mkdir(logDir);

        // test
        var frontend = new Frontend(_application, tmpDir, packageId, platformId);

        test.equal(frontend.output instanceof TerminalOutput.class, true);

        test.equal(frontend.packageId, packageId);

        test.equal(frontend.platformId, platformId);

        test.equal(ShellJS.test("-d", frontend.appDir), true);

        test.equal(ShellJS.test("-d", frontend.platformDir), true);

        test.equal(ShellJS.test("-d", frontend.packageDir), true);

        test.equal(frontend.logfileOutput instanceof LogfileOutput, true);

        var downloadsCachePath = process.env.CROSSWALK_APP_TOOLS_DOWNLOAD_DIR ?
                                    process.env.CROSSWALK_APP_TOOLS_DOWNLOAD_DIR :
                                    null;
        test.equal(ShellJS.test("-d", frontend.downloadsCachePath), downloadsCachePath);

        ShellJS.rm("-rf", tmpDir);

        test.done();
    }
};
