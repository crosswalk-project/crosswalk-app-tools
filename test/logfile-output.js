// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var OS = require('os');
var Path = require("path");

var ShellJS = require("shelljs");

var LogfileOutput = require("../src/LogfileOutput");
var Util = require("./util/Util.js");

// Test involves output, make it visible.
require("../src/Config").getInstance().setSilentConsole(false);
var _output = require("../src/TerminalOutput").getInstance();


function testMethod(func, message) {
    
    // Setup
    var tmpfile = Util.createTmpFile();
    var log = new LogfileOutput(tmpfile);
    
    // Test
    var output = func.call(log, message);
    
    // Read back results to check
    var input = FS.readFileSync(tmpfile, {"encoding": "utf8"});
    
    ShellJS.rm("-f", tmpfile);

    return output == input;
}



exports.tests = {

    error: function(test) {
        
        test.expect(1);
        var ret = testMethod(LogfileOutput.prototype.error, "error message");
        test.equal(ret, true);
        test.done();
    },

    warning: function(test) {
        
        test.expect(1);
        var ret = testMethod(LogfileOutput.prototype.warning, "warning message");
        test.equal(ret, true);
        test.done();
    },

    info: function(test) {
        
        test.expect(1);
        var ret = testMethod(LogfileOutput.prototype.info, "info message");
        test.equal(ret, true);
        test.done();
    },
    
    highlight: function(test) {
        
        test.expect(1);
        var ret = testMethod(LogfileOutput.prototype.highlight, "highlight message");
        test.equal(ret, true);
        test.done();
    },

    print: function(test) {
        
        test.expect(1);
        var ret = testMethod(LogfileOutput.prototype.write, "print message");
        test.equal(ret, true);
        test.done();
    }
};
