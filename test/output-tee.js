// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");

var ShellJS = require("shelljs");

var LogfileOutput = require("../src/LogfileOutput");
var OutputTee = require("../src/OutputTee");
var Util = require("../test-util/Util.js");

function testFunction(func) {
    
    var f1 = Util.createTmpFile();
    var l1 = new LogfileOutput(f1);

    var f2 = Util.createTmpFile();
    var l2 = new LogfileOutput(f2);

    var tee = new OutputTee(l1, l2);
    
    func.call(tee, "foo");

    var buf1 = FS.readFileSync(f1, {"encoding": "utf8"});
    var buf2 = FS.readFileSync(f2, {"encoding": "utf8"});

    ShellJS.rm("-rf", f1);
    ShellJS.rm("-rf", f2);

    return buf1 == buf2;
}

exports.tests = {

    properties: function(test) {

        test.expect(3);

        var f1 = Util.createTmpFile();
        var l1 = new LogfileOutput(f1);

        var f2 = Util.createTmpFile();
        var l2 = new LogfileOutput(f2);

        var tee = new OutputTee(l1, l2);

        test.equal(tee.logfileOutput, l1);
        test.equal(tee.terminalOutput, l2);
        test.equal(tee.logfileOutput != tee.terminalOutput, true);

        ShellJS.rm("-rf", f1);
        ShellJS.rm("-rf", f2);

        test.done();
    },

    error: function(test) {

        test.expect(1);
        var ret = testFunction(OutputTee.prototype.error);
        test.equal(ret, true);
        test.done();
    },

    warning: function(test) {

        test.expect(1);
        var ret = testFunction(OutputTee.prototype.warning);
        test.equal(ret, true);
        test.done();
    },

    info: function(test) {

        test.expect(1);
        var ret = testFunction(OutputTee.prototype.info);
        test.equal(ret, true);
        test.done();
    },

    highlight: function(test) {

        test.expect(1);
        var ret = testFunction(OutputTee.prototype.highlight);
        test.equal(ret, true);
        test.done();
    },

    write: function(test) {

        test.expect(1);
        var ret = testFunction(OutputTee.prototype.write);
        test.equal(ret, true);
        test.done();
    },

    verbose: function(test) {

        test.expect(1);
        var ret = testFunction(OutputTee.prototype.verbose);
        test.equal(ret, true);
        test.done();
    }
};
