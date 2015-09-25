// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

module.exports = {
    Application: require("./src/Application"),
    OutputIface: require("./src/OutputIface"),
    OutputTee: require("./src/OutputTee"),
    LogfileOutput: require("./src/LogfileOutput"),
    TerminalOutput: require("./src/TerminalOutput").class,
    main: require("./src/Main"),
};
