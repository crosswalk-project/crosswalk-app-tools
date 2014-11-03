#!/usr/bin/env node

// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

// This is a quick and dirty script for running nodeunit
// tests standalone.

function Driver() {}

Driver.prototype.expect = function(asserts) {

    console.log("  Expect " + asserts);
};

Driver.prototype.equal = function(exp1, exp2) {

    console.log("  Equal " + exp1 + " == " + exp2);
};

Driver.prototype.done = function() {

    console.log("Done.\n");
};



if (process.argv.length <= 2) {

    console.log("Usage: run.js <script>");

} else {

    var script = process.argv[2];
    console.log("Running " + script);

    var test = require(script);
    if (test.tests) {
        var driver = new Driver();

        for (var key in test.tests) {

            console.log("Testing " + key);
            test.tests[key](new Driver());
        }
    }
}