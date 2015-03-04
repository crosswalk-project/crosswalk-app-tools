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

    _output.write("  Expect " + asserts + "\n");
};

Driver.prototype.equal = function(exp1, exp2) {

    _output.write("  Equal " + exp1 + " == " + exp2 + "\n");
};

Driver.prototype.done = function() {

    _output.write("Done.\n\n");
};



if (process.argv.length <= 2) {

    _output.write("Usage: run.js <script>\n");

} else {

    var script = process.argv[2];
    _output.write("Running " + script + "\n");

    var test = require(script);
    // Force verbose
    _config.setSilentConsole(false);

    if (test.tests) {

        if (test.tests.setUp) {
            test.tests.setUp(function() {});
        }

        var testCase = process.argv[3];
        if (testCase) {

            // Run named test.
            _output.write("Testing " + testCase + "\n");
            test.tests[testCase](new Driver());

        } else {

            // Run all tests
            for (var key in test.tests) {

                if (key == "setUp" || key == "tearDown")
                    continue;

                _output.write("Testing " + key + "\n");
                test.tests[key](new Driver());
            }
        }

        if (test.tests.tearDown) {
            test.tests.tearDown(function() {});
        }
    }
}
