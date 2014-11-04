#!/usr/bin/env node

// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

// This is a quick and dirty script for running nodeunit
// tests standalone.

var Config = require("../src/Config");
var Console = require("../src/Console");

function Driver() {}

Driver.prototype.expect = function(asserts) {

    Console.log("  Expect " + asserts);
};

Driver.prototype.equal = function(exp1, exp2) {

    Console.log("  Equal " + exp1 + " == " + exp2);
};

Driver.prototype.done = function() {

    Console.log("Done.\n");
};



if (process.argv.length <= 2) {

    Console.log("Usage: run.js <script>");

} else {

    var script = process.argv[2];
    Console.log("Running " + script);

    var test = require(script);
    // Force verbose
    Config.setSilentConsole(false);

    if (test.tests) {
        var driver = new Driver();

        for (var key in test.tests) {

            Console.log("Testing " + key);
            test.tests[key](new Driver());
        }
    }
}