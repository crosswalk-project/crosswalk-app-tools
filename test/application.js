// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Path = require('path');

var ShellJS = require("shelljs");

var Application = require("../src/Application");
var Config = require("../src/Config");
var IllegalAccessException = require("../src/util/exceptions").IllegalAccessException;
var TerminalOutput = require("../src/TerminalOutput");
var Util = require("../test-util/Util");

var _basePath = null;
var _packageId = "com.example.foo";
var _application = null;

exports.tests = {

    create: function(test) {

        test.expect(6);

        _basePath = Util.createTmpDir();
        _application = new Application(_basePath, _packageId);

        test.equal(_application.packageId, _packageId);
        test.equal(ShellJS.test("-d", _application.appPath), true);
        test.equal(ShellJS.test("-d", _application.logPath), true);
        test.equal(ShellJS.test("-d", _application.pkgPath), true);
        test.equal(ShellJS.test("-d", _application.prjPath), true);
        test.equal(ShellJS.test("-d", _application.rootPath), true);

        test.done();
    },

    load: function(test) {

        test.expect(6);

        var rootPath = _basePath + Path.sep + _packageId;
        _application = new Application(rootPath, null);

        test.equal(_application.packageId, _packageId);
        test.equal(ShellJS.test("-d", _application.appPath), true);
        test.equal(ShellJS.test("-d", _application.logPath), true);
        test.equal(ShellJS.test("-d", _application.pkgPath), true);
        test.equal(ShellJS.test("-d", _application.prjPath), true);
        test.equal(ShellJS.test("-d", _application.rootPath), true);

        test.done();
    },

    downloadsCachePath: function(test) {

        test.expect(1);

        var downloadsCachePath = process.env.CROSSWALK_APP_TOOLS_DOWNLOAD_DIR ?
                                    process.env.CROSSWALK_APP_TOOLS_DOWNLOAD_DIR :
                                    null;
        test.equal(ShellJS.test("-d", _application.downloadsCachePath), downloadsCachePath);

        test.done();
    },

    getConfig: function(test) {

        test.expect(1);
        var config = _application.config;
        test.equal(config instanceof Config.class, true);
        test.done();
    },

    setConfig: function(test) {

        test.expect(1);
        try {
            _application.config = null;
        } catch (e) {
            test.equal(e instanceof IllegalAccessException, true);
        }
        test.done();
    },

    getOutput: function(test) {

        test.expect(1);
        var output = _application.output;
        test.equal(output instanceof TerminalOutput.class, true);
        test.done();
    },

    setOutput: function(test) {

        test.expect(1);
        try {
            _application.output = null;
        } catch (e) {
            test.equal(e instanceof IllegalAccessException, true);
        }
        test.done();
    },

    // Why does tearDown break?
    cleanup: function(test) {

        test.expect(2);

        test.equal(ShellJS.test("-d", _basePath), true);

        ShellJS.rm("-rf", _basePath);

        test.equal(ShellJS.test("-d", _basePath), false);

        test.done();
    }
};
