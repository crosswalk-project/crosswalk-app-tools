// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var OS = require('os');
var MkTemp = require('mktemp');
var ShellJS = require("shelljs");

var Downloader = require("../src/util/Downloader");

// Test involves progress output, make it visible.
require("../src/Config").getInstance().setSilentConsole(false);
var _output = require("../src/Main").output;

function testDownload(test, url) {

    test.expect(1);

    // MkTemp creates temp dir in working dir, so cd tmp first.
    ShellJS.pushd(OS.tmpdir());

    // HACK create and remove tmpfile just to allocate a name.
    var tmpfile = MkTemp.createFileSync("crosswalk-app-tools.test.downloader.XXXXXX");
    _output.info("Tempfile: " + tmpfile);
    ShellJS.rm(tmpfile);

    var label = "Fetching " + url;
    var indicator = _output.createFiniteProgress(label);

    var downloader = new Downloader(url, tmpfile);
    downloader.progress = function(progress) {
        indicator.update(progress);
    };
    downloader.get(function(errormsg) {

        indicator.done("");

        if (errormsg) {

            _output.error(errormsg);

        } else {

            // Parse
            var buffer = FS.readFileSync(tmpfile, {"encoding": "utf8"});
            test.equal(buffer.length > 0, true);
        }

        ShellJS.rm(tmpfile);
        test.done();
    });
}

exports.tests = {

    http: function(test) {

        testDownload(test, "http://www.intel.com");
    },

    https: function(test) {

        testDownload(test, "https://01.org");
    }
};
