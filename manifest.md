Manifest.json fields
====================

## Standard fields

(In alphabetical order.)

* Field `display`: http://www.w3.org/TR/appmanifest/#display-member

* Field `icons`: http://www.w3.org/TR/appmanifest/#icons-member

Basic implementation only.

* Field `name`: http://www.w3.org/TR/appmanifest/#name-member

* Field `short_name`: http://www.w3.org/TR/appmanifest/#short_name-member

* Field `start_url`: http://www.w3.org/TR/appmanifest/#start_url-member

## Extension fields

(In alphabetical order.)

* Extension field `xwalk_app_version`: Version number, between 1 and 99.99.999

* Extension field `xwalk_package_id`: Unique package identifier, e.g. `com.example.foo`.

* Extension field `xwalk_target_platforms`: Target platform, e.g. `android`. At the moment only a single value is supported.

* Extension field `xwalk_android_animatable_view`: Whether to allow zooming the browser view (`true`/`false`).

* Extension field `xwalk_android_keep_screen_on`: Whether to keep the screen on while the app is in front (`true`/`false`).

* Extension field `xwalk_windows_update_id`: Automatically generated identifier for native windows support (work in progress).

* Extension field `xwalk_windows_vendor`: Vendor string for native windows support (work in progress).
