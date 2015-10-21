Manifest.json fields
====================

### Mandatory fields

* `name`:	http://w3c.github.io/manifest/ Will be uses as label in the android launcher.
* `icons`:	http://w3c.github.io/manifest/ Basic support, only one resolution per icon entry.
* `start_url`:	http://w3c.github.io/manifest/ First html page to load.xw
* `xwalk_app_version: "a.b.c"`: Three part application version number e.g. 1.2.3 needed for android and windows packaging.
* `xwalk_package_id: "com.example.foo"`: Canonical name e.g. com.example.foo.

### Extra fields

* `display`:	http://w3c.github.io/manifest/ Values "standalone" and "fullscreen" are supported on Android.
* `orientation`:	http://w3c.github.io/manifest/
* `short_name`:	http://w3c.github.io/manifest/ Value has no effect on Android, as `name` is used for the launcher label.
* `xwalk_android_keep_screen_on: true/false`: Whether to keep the screen on while app is in the foreground.
* `xwalk_android_webp: "x y z"`: Convert assets to webp, needs "cwebp" from google. Values between 1 and 100, e.g. `80 80 80`. See https://developers.google.com/speed/webp/.
* `xwalk_command_line: "command-line"`: Extra parameters to pass to the crosswalk engine, e.g. for overriding blacklisted GPU drivers. 
* `xwalk_extensions: <array-of-paths>`: Array of paths to extensions for bundling.
* `xwalk_hosts`: See https://crosswalk-project.org/documentation/manifest/xwalk_hosts.html.
