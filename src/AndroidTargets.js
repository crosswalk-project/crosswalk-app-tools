// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

/**
 * The AndroidTargets object wraps targets enumeration and selection.
 * @param {String} buffer Output from "android list targets" for evaluation.
 * @throws {TypeError} When buffer is not a string.
 * @constructor
 */
function AndroidTargets(buffer) {

    if (typeof buffer != "string") {
        throw new TypeError("AndroidTargets(buffer) must be of type String (is " + typeof buffer + ").");
    }

    this._buffer = buffer;
}

/**
 * Parse SDK targets buffer passed to the constructor.
 * @returns Targets object in the form of { target : ABIs }.
 * @memberOf AndroidTargets
 */
AndroidTargets.prototype.parse = function() {

    var lines = this._buffer.split('\n');
    var target = null;
    var targets = {};
    lines.forEach(function(line) {

        var match = null;
    
        if (target === null) {
            // Look for target paragraph.
            match = "id: ";
            if (line.substring(0, match.length) === match &&
                line.indexOf('"') < line.lastIndexOf('"')) {

                target = line.substring(line.indexOf('"') + 1,
                                        line.lastIndexOf('"'));
            }
        } else {
            // Look for ABI line.
            match = " Tag/ABIs : ";
            var abis = line.substring(line.indexOf(':') + 1, line.length);
            if (line.substring(0, match.length) === match &&
                abis != " no ABIs.") {

                targets[target] = abis;
                target = null;
            }
        }
    });

    return targets;
};

/**
 * Pick preferred target for creation of new projects.
 * @returns Target identifier string or null if no ABIs are installed.
 * @memberOf AndroidTargets
 */
AndroidTargets.prototype.pick = function() {

    var targets = this.parse();

    var pick1 = null;
    var pick2 = null;
    var pick3 = null;

    for (var target in targets) {
        var abis = targets[target];

        if (abis.indexOf("armeabi-v7a") > -1 &&
            abis.indexOf("x86") > -1) {

            // Both ABIs, best pick.
            // If already having a pick, update only if it's "default" (not TV) target
            if (pick1 !== null && abis.indexOf("default") > -1) {
                pick1 = target;
            } else if (pick1 === null) {
                pick1 = target;
            }

        } else if (abis.indexOf("armeabi-v7a") > -1) {

            // Let's be honest.
            // If already having a pick, update only if it's "default" (not TV) target
            if (pick2 !== null && abis.indexOf("default") > -1) {
                pick2 = target;
            } else if (pick2 === null) {
                pick2 = target;
            }

        } else if (abis.indexOf("x86") > -1) {

            // If already having a pick, update only if it's "default" (not TV) target
            if (pick3 !== null && abis.indexOf("default") > -1) {
                pick3 = target;
            } else if (pick3 === null) {
                pick3 = target;
            }
        }
    }

    return pick1 !== null ? pick1 :
           pick2 !== null ? pick2 :
           pick3 !== null ? pick3 :
           null;
};

module.exports = AndroidTargets;
