// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var MemoryStream = require("memorystream");

var Downloader = require("../src/util/Downloader");
var IndexParser = require("../src/util/IndexParser");

var _output = require("../src/TerminalOutput").getInstance();

function downloadAndParse(url, test) {

    test.expect(1);

    // Download
    var stream = new MemoryStream();
    var buffer = "";
    stream.on("data", function(data) {
        buffer += data.toString();
    });

    var downloader = new Downloader(url, stream);
    downloader.get(function(errormsg) {

        var parser = new IndexParser(buffer);
        var versions = parser.parse();
        var latest = IndexParser.pickLatest(versions, function (errormsg) {
            _output.error(errormsg);
        });
        var a = latest.split(".");
        test.equal(a.length, 4);
        test.done();
    });
}

exports.tests = {

    stable: function(test) {

        downloadAndParse("https://download.01.org/crosswalk/releases/crosswalk/android/stable/", test);
    },

    beta: function(test) {

        downloadAndParse("https://download.01.org/crosswalk/releases/crosswalk/android/beta/", test);
    },

    canary: function(test) {

        downloadAndParse("https://download.01.org/crosswalk/releases/crosswalk/android/canary/", test);
    },

    pickLatest1: function(test) {

        test.expect(1);

        var versions = [
            "1.2.3.4",
            "5.9.7.8",
            "7.6.5.4"
        ];
        var version = IndexParser.pickLatest(versions,
                                             function (errormsg) {
            _output.error(errormsg);
            // Make test fail with premature done()
            test.done();
        });
        test.equal(version, "7.6.5.4");
        test.done();
    },

    pickLatest2: function(test) {

        test.expect(2);

        // Bad test, pass invalid versions array null
        var version = IndexParser.pickLatest(null,
                                             function (errormsg) {
            _output.error(errormsg);
            // Make sure we visit this code path
            test.equal(1, 1);
        });
        test.equal(version, null);
        test.done();
    },

    pickLatest3: function(test) {

        test.expect(2);

        // Bad test, pass invalid empty versions array
        var version = IndexParser.pickLatest([],
                                             function (errormsg) {
            _output.error(errormsg);
            // Make sure we visit this code path
            test.equal(1, 1);
        });
        test.equal(version, null);
        test.done();
    },
};
