// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.



/**
 * The AndroidTargets object wraps targets enumeration and selection.
 * @constructor
 * @param {String} buffer Output from "android list targets" for evaluation
 * @throws {TypeError} If buffer is not a string.
 */
function AndroidTargets(buffer) {

    if (typeof buffer != "string") {
        throw new TypeError("AndroidTargets(buffer) must be of type String (is " + typeof buffer + ").");
    }

    this._buffer = buffer;
}

/**
 * Parse SDK targets buffer passed to the constructor.
 * @param {Boolean} [onlyABI] Optionally only return targets with ABI installed when true
 * @returns {Object} Targets object in the form of \{ target : ABIs \}.
 */
AndroidTargets.prototype.parse =
function(onlyABI) {

    if (typeof onlyABI == "undefined")
        onlyABI = false;

    var lines = this._buffer.split('\n');
    var target = null;
    var targets = {};
    lines.forEach(function(line) {

        var match = null;

        // Look for target paragraph (starts with "id:")
        // and cache target name.
        match = "id: ";
        if (line.substring(0, match.length) === match &&
            line.indexOf('"') < line.lastIndexOf('"')) {

            target = line.substring(line.indexOf('"') + 1,
                                    line.lastIndexOf('"'));

        }

        // If we are in target paragraph, look for ABI line.
        if (target !== null) {
            match = " Tag/ABIs : ";
            var abis = line.substring(line.indexOf(':') + 1, line.length);
            if (line.substring(0, match.length) === match) {
                if (abis != " no ABIs." || onlyABI === false) {

                    targets[target] = abis;
                    target = null;
                }
            }
        }

        // At end of target paragraph reset cached target name.
        if (line == "----------") {
            target = null;
        }
    });

    return targets;
};

/**
 * Pick preferred target for creation of new projects.
 * @returns {String} Target identifier string or null if no ABIs are installed.
 */
AndroidTargets.prototype.pick =
function() {

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

/**
 * Pick lowest target above minAPILevel.
 * @param {Number} minAPILevel Lowest permitted target API level
 * @returns {String} Target identifier string or null if no matching target found.
 */
AndroidTargets.prototype.pickLowest =
function(minAPILevel) {

    var targets = this.parse();
    var lowestTarget = null;

    for (var target in targets) {
        var a = target.split('-');
        var level = Number(a[1]);
        if (level >= minAPILevel) {
            lowestTarget = target;
            break;
        }
    }

    return lowestTarget;
};

module.exports = AndroidTargets;
