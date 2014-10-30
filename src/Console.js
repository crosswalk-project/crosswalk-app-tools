// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

module.exports.error = function(message) {

    console.error("ERROR: " + message);
};

module.exports.warning = function(message) {

    console.error("WARNING: " + message);
};
