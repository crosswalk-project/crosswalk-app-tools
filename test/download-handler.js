// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var OS = require("os");
var Path = require("path");

var ShellJS = require("shelljs");

var Downloader = require("../src/util/Downloader");
var DownloadHandler = require("../src/util/DownloadHandler");
var Util = require("../test-util/Util.js");

var _output = require("../src/TerminalOutput").getInstance();



exports.tests = {

    handle: function(test) {

        test.expect(2);

        // Create temporary file
        var tmpPath = Util.createTmpFile();

        // Test for temporary file using local lookup
        var tmpDir = Path.dirname(tmpPath);
        var tmpFile = Path.basename(tmpPath);
        var handler = new DownloadHandler(tmpDir, tmpFile);
        var pathFound = handler.findLocally([tmpDir]);
        test.equal(tmpPath, pathFound);

        ShellJS.rm(tmpPath);

        // Download
        var url = "https://www.linuxfoundation.org";
        var label = "Fetching " + url;
        var indicator = _output.createFiniteProgress(label);
        var stream = handler.createStream();
        var downloader = new Downloader(url, stream);
        downloader.progress = function(progress) {
            indicator.update(progress);
        };
        downloader.get(function(errormsg) {

            indicator.done();
            if (errormsg) {
                _output.error(errormsg);
            } else {
                // Finish download
                var downloadPath = handler.finish(null);
                test.equal(tmpPath, downloadPath);
                ShellJS.rm(downloadPath);
                test.done();
            }
        });
    }
};
