// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var OS = require('os');
var Path = require("path");

var MkTemp = require('mktemp');
var ShellJS = require("shelljs");

var LogfileOutput = require("../src/LogfileOutput");

// Test involves output, make it visible.
require("../src/Config").getInstance().setSilentConsole(false);
var _output = require("../src/Main").getOutput();

var _tmpfile = null;
var _log = null;


exports.tests = {

    setUp: function(done) {
        
        // MkTemp creates temp dir in working dir, so cd tmp first.
        ShellJS.pushd(OS.tmpdir());

        _tmpfile = MkTemp.createFileSync("XXXXXX.crosswalk-app-tools.logfile");
        _log = new LogfileOutput(OS.tmpdir() + Path.sep + _tmpfile);

        done();
    },

    tearDown: function(done) {

        var content = FS.readFileSync(_tmpfile, {"encoding": "utf8"});
        
        ShellJS.rm("-f", _tmpfile);
        ShellJS.popd();
        
        done();
    },

    error: function(test) {
        
        test.expect(1);
        _log.error("error message");
        test.equal(true, true);
        test.done();
    },

    warning: function(test) {
        
        test.expect(1);
        _log.warning("warning message");
        test.equal(true, true);
        test.done();
    },

    info: function(test) {
        
        test.expect(1);
        _log.info("info message");
        test.equal(true, true);
        test.done();
    },
    
    highlight: function(test) {
        
        test.expect(1);
        _log.highlight("highlight message");
        test.equal(true, true);
        test.done();
    },

    print: function(test) {
        
        test.expect(1);
        _log.print("print message");
        test.equal(true, true);
        test.done();
    }
};
