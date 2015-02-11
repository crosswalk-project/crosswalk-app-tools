#!/usr/bin/env node

// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

// This is a quick and dirty script for running nodeunit
// tests standalone.

var _config = require("../src/Config").getInstance();
var _output = require("../src/TerminalOutput").getInstance();

function Driver() {}

Driver.prototype.expect = function(asserts) {

    _output.print("  Expect " + asserts);
};

Driver.prototype.equal = function(exp1, exp2) {

    _output.print("  Equal " + exp1 + " == " + exp2);
};

Driver.prototype.done = function() {

    _output.print("Done.\n");
};



if (process.argv.length <= 2) {

    _output.print("Usage: run.js <script>");

} else {

    var script = process.argv[2];
    _output.print("Running " + script);

    var test = require(script);
    // Force verbose
    _config.setSilentConsole(false);

    if (test.tests) {

        if (test.tests.setUp) {
            test.tests.setUp(function() {});
        }

        for (var key in test.tests) {

            if (key == "setUp" || key == "tearDown")
                continue;

            _output.print("Testing " + key);
            test.tests[key](new Driver());
        }

        if (test.tests.tearDown) {
            test.tests.tearDown(function() {});
        }
    }
}
