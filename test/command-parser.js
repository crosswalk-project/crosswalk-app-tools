// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var CommandParser = require("../src/CommandParser");

exports.tests = {

    ctor: function(test) {

        test.expect(2);

        // Invalid instantiation without argv, throws TypeError.
        try {
            var cp1 = new CommandParser();
        } catch(e) {
            test.equal(e instanceof TypeError, true);
        }

        // Valid instantiation.
        var cp2 = new CommandParser(["foo", "bar", "baz"]);
        test.equal(cp2 instanceof CommandParser, true);

        test.done();
    },

    getCommand: function(test) {

        test.expect(5);

        var commands = ["create", "update", "refresh", "build"];
        var argv = ["foo", "bar"];
        var cp1;

        // Test getCommand() gives back correct command.
        commands.forEach(function(item) {

            argv[2] = item;
            cp1 = new CommandParser(argv);
            test.equal(cp1.getCommand(), item);
        });

        // Test invalid command "baz" not recognised.
        var cp2 = new CommandParser(["foo", "bar", "baz"]);
        var cmd = cp2.getCommand();
        test.equal(commands.indexOf(cmd), -1);

        test.done();
    }
};
