#!/usr/bin/env node

// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

// This is a quick and dirty script for running nodeunit
// tests standalone.

var Config = require("../src/Config");
var Output = require("../src/TerminalOutput");

function Driver() {}

Driver.prototype.expect = function(asserts) {

    Output.log("  Expect " + asserts);
};

Driver.prototype.equal = function(exp1, exp2) {

    Output.log("  Equal " + exp1 + " == " + exp2);
};

Driver.prototype.done = function() {

    Output.log("Done.\n");
};



if (process.argv.length <= 2) {

    Output.log("Usage: run.js <script>");

} else {

    var script = process.argv[2];
    Output.log("Running " + script);

    var test = require(script);
    // Force verbose
    Config.setSilentConsole(false);

    if (test.tests) {

        if (test.tests.setUp) {
            test.tests.setUp(function() {});
        }

        for (var key in test.tests) {

            if (key == "setUp" || key == "tearDown")
                continue;

            Output.log("Testing " + key);
            test.tests[key](new Driver());
        }

        if (test.tests.tearDown) {
            test.tests.tearDown(function() {});
        }
    }
}
