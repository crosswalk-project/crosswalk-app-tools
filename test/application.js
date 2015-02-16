// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Application = require("../src/Application");
var Config = require("../src/Config");
var TerminalOutput = require("../src/TerminalOutput");
var IllegalAccessException = require("../src/util/exceptions").IllegalAccessException;

exports.tests = {

    getConfig: function(test) {

        test.expect(1);
        var application = new Application();
        var config = application.config;
        test.equal(config instanceof Config.class, true);
        test.done();
    },

    setConfig: function(test) {

        test.expect(1);
        var application = new Application();
        try {
            application.config = null;
        } catch (e) {
            test.equal(e instanceof IllegalAccessException, true);
        }
        test.done();
    },

    getOutput: function(test) {

        test.expect(1);
        var application = new Application();
        var output = application.output;
        test.equal(output instanceof TerminalOutput.class, true);
        test.done();
    },

    setOutput: function(test) {

        test.expect(1);
        var application = new Application();
        try {
            application.output = null;
        } catch (e) {
            test.equal(e instanceof IllegalAccessException, true);
        }
        test.done();
    }
};
