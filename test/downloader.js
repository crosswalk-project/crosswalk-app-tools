// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var OS = require("os");

var MemoryStream = require('memorystream');
var ShellJS = require("shelljs");

var Downloader = require("../src/util/Downloader");
var Util = require("../test-util/Util.js");

// Test involves progress output, make it visible.
require("../src/Config").getInstance().setSilentConsole(false);
var _output = require("../src/TerminalOutput").getInstance();


function testStream(url, stream, callback) {

    var label = "Fetching " + url;
    var indicator = _output.createFiniteProgress(label);

    var downloader = new Downloader(url, stream);
    downloader.progress = function(progress) {
        indicator.update(progress);
    };
    downloader.get(function(errormsg) {

        indicator.done();

        if (errormsg) {

            _output.error(errormsg);

        } else {

            callback();
        }
    });
}

function testFile(url, callback) {

    // HACK create and remove tmpfile just to allocate a name.
    var tmpfile = Util.createTmpFile();
    _output.info("Tempfile:", tmpfile);
    ShellJS.rm(tmpfile);

    var options = {
        flags: "w",
        mode: 0600
    };
    var stream = FS.createWriteStream(tmpfile, options);

    testStream(url, stream, function() {

        // Parse
        var buffer = FS.readFileSync(tmpfile, {"encoding": "utf8"});
        ShellJS.rm(tmpfile);
        callback(buffer.length);
    });
}

exports.tests = {

    httpsFile: function(test) {

        test.expect(1);

        testFile("https://download.01.org", function(size) {

            test.equal(size > 0, true);
            test.done();
        });
    },

    httpsStream: function(test) {

        test.expect(1);

        var stream = new MemoryStream();

        var buffer = "";
        stream.on("data", function(chunk) {
            buffer += chunk.toString();
        });

        testStream("https://download.01.org", stream, function() {

            test.equal(buffer.length > 0, true);
            test.done();
        });
    }
};
