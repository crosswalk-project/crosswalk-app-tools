// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Path = require('path');

var ShellJS = require("shelljs");

var Application = require("../src/Application");
var Config = require("../src/Config");
var IllegalAccessException = require("../src/util/exceptions").IllegalAccessException;
var LogfileOutput = require("../src/LogfileOutput");
var OutputTee = require("../src/OutputTee");
var Util = require("./util/Util.js");


exports.tests = {

    create: function(test) {

        test.expect(6);

        var application = Util.createTmpApplication("com.example.foo");

        test.equal(application.packageId, "com.example.foo");
        test.equal(ShellJS.test("-d", application.appPath), true);
        test.equal(ShellJS.test("-d", application.logPath), true);
        test.equal(ShellJS.test("-d", application.pkgPath), true);
        test.equal(ShellJS.test("-d", application.prjPath), true);
        test.equal(ShellJS.test("-d", application.rootPath), true);

        Util.deleteTmpApplication(application);

        test.done();
    },

    load: function(test) {

        test.expect(6);

        var application = Util.createTmpApplication("com.example.foo");

        // reload
        var rootPath = application.rootPath;
        application = new Application(rootPath, null);

        test.equal(application.packageId, "com.example.foo");
        test.equal(ShellJS.test("-d", application.appPath), true);
        test.equal(ShellJS.test("-d", application.logPath), true);
        test.equal(ShellJS.test("-d", application.pkgPath), true);
        test.equal(ShellJS.test("-d", application.prjPath), true);
        test.equal(ShellJS.test("-d", application.rootPath), true);

        Util.deleteTmpApplication(application);

        test.done();
    },

    getConfig: function(test) {

        test.expect(1);
        var application = Util.createTmpApplication("com.example.foo");
        var config = application.config;
        test.equal(config instanceof Config.class, true);
        Util.deleteTmpApplication(application);
        test.done();
    },

    setConfig: function(test) {

        test.expect(1);
        var application = Util.createTmpApplication("com.example.foo");
        try {
            application.config = null;
        } catch (e) {
            test.equal(e instanceof IllegalAccessException, true);
        }
        Util.deleteTmpApplication(application);
        test.done();
    },

    getOutput: function(test) {

        test.expect(1);
        var application = Util.createTmpApplication("com.example.foo");
        var output = application.output;
        test.equal(output instanceof OutputTee, true);
        Util.deleteTmpApplication(application);
        test.done();
    },

    setOutput: function(test) {

        test.expect(1);
        var application = Util.createTmpApplication("com.example.foo");
        try {
            application.output = null;
        } catch (e) {
            test.equal(e instanceof IllegalAccessException, true);
        }
        Util.deleteTmpApplication(application);
        test.done();
    },

    logging: function(test) {

        test.expect(5);

        var application = Util.createTmpApplication("com.example.foo");
        
        test.equal(application.platformLogfileOutput === null, true);
        application.output.write("foo");

        // Set platform logfile.
        var platformLogfilePath = Util.createTmpFile();
        var platformLogfileOutput = new LogfileOutput(platformLogfilePath);
        application.platformLogfileOutput = platformLogfileOutput;
        test.equal(application.platformLogfileOutput == platformLogfileOutput, true);

        application.output.write("bar");

        application.platformLogfileOutput = null;
        test.equal(application.platformLogfileOutput === null, true);

        application.output.write("baz");

        var commonLogPath = Path.join(application.logPath, "common.log");
        var commonLog = FS.readFileSync(commonLogPath, {"encoding": "utf8"});
        test.equal(commonLog, "foobaz");

        var platformLog = FS.readFileSync(platformLogfilePath, {"encoding": "utf8"});
        test.equal(platformLog, "bar");

        Util.deleteTmpApplication(application);
        ShellJS.rm("-rf", platformLogfilePath);

        test.done();
    }
};
