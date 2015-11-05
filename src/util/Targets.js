// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * Target architecture matching.
 * @constructor
 */
function Targets() {

}

/**
 * Map of ABI name to word size (32 or 64bit)
 * @member {String} ABI_WORDSIZE
 * @static
 * @memberOf Targets
 */
Object.defineProperty(Targets, "ABI_WORDSIZE", {
                      get: function() {
                                return {"armeabi-v7a":  32,
                                        "arm64-v8a":    64,
                                        "x86":          32,
                                        "x86_64":       64};
                           }
                      });

/**
 * Match key to ABIs. If an exact match key == abi is found, it is returned.
 * Otherwise the matching goes on to see whether the key is the prefix of an ABI,
 * or equal to the word size (32 or 64), in which case those ABIs are returned.
 * @param {String} key Search key
 * @returns {String[]} Array of matched ABIs.
 * @static
 */
Targets.match =
function(key) {

    var match = [];

    if (key != 32 &&
        key != 64 &&
        typeof key != "string") {
        return match;
    }

    // Exact match
    var size = Targets.ABI_WORDSIZE[key];
    if (size) {
        return [ key ];
    }

    for (var abi in Targets.ABI_WORDSIZE) {

        // Prefix match
        if (abi.substring(0, key.length) === key) {
            match.push(abi);
        }

        // Key match
        if (key == Targets.ABI_WORDSIZE[abi]) {
            match.push(abi);
        }
    }

    return match;
};

module.exports = Targets;
