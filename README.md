Crosswalk-app-tools
===================

Crosswalk-app-tools is our forthcoming packaging tool for creating Crosswalk applications. We are inviting early adopters to build their web applications using crosswalk-app-tools, and provide feedback for future improvements.


### Installation

The tools are cross-platform by virtue of being based on Node.js. We are supporting Microsoft Windows, Apple OS X and Linux as host operating systems.

The following components are required
  * Node.js and NPM
  * Android development (APK packages): Android SDK with 5.0 (target-21) or later installed, plus Java JDK and Apache Ant. Supported host systems are Apple OS X, Linux, and Windows.
  * Windows development (MSI packages): [WiX Toolset](http://wixtoolset.org). MSI installers can only be created on Windows systems.

In order to get the tools available from the command-line easily, global npm installation is recommended.

Microsoft Windows: `npm install -g crosswalk-app-tools`

Apple OS X and Linux: `sudo npm install -g crosswalk-app-tools`

The best way to check if a machine has all the required dependencies is to create and build a plain empty Android app 
on the system. If this does not work, then building Crosswalk apps will not succeed either. App-tools provides a command for doing this:

Check Android target setup:
```
crosswalk-app check android
```
Check Windows target setup:
```
crosswalk-app check windows
```

Two executables are provided, `crosswalk-app` implements low level helper commands, `crosswalk-pkg` is the main tool for creating packages.

### Usage (crosswalk-pkg --help)

```
  Crosswalk Project Packaging Tool -- https://crosswalk-project.org
  Usage: crosswalk-pkg <options> <path>

  <options>
    -a --android=<android-conf>      Extra configurations for Android
    -c --crosswalk=<version-spec>    Specify Crosswalk version or path
    -h --help                        Print usage information
    -k --keep                        Keep build tree for debugging
    -m --manifest=<package-id>       Fill manifest.json with default values
    -p --platforms=<target-systems>  Specify target platform
    -r --release                     Build release packages
    -s --skip-check                  Skip host setup check before building
    -t --targets=<target-archs>      Target CPU architectures
    -v --version                     Print tool version
    -w --windows=<windows-conf>      Extra configurations for Windows

  <path>
    Path to directory that contains a web app

  <android-conf>
    Quoted string with extra config, e.g. "shared"
    * "shared" Build APK that depends on crosswalk in the Google Play Store
    * "lite"   Use crosswalk-lite, see Crosswalk Wiki

  <package-id>
    Canonical application name, e.g. com.example.foo, needs to
    * Comprise of 3 or more period-separated parts
    * Begin with lowecase letters

  <target-archs>
    List of CPU architectures for which to create packages.
    Currently supported ABIs are: armeabi-v7a, arm64-v8a, x86, x86_64
    * Prefixes will be matched, so "a","ar", or "arm" yield both ARM APKs
    * Same for "x" and "x8", but "x86" is an exact match, only x86-32 conforms
    * Short-hands "32" and "64" build ARM and x86 for the requested word size
    * Default behavior is equivalent to "32", creation of 32-bit installers
    Example: --targets="arm x86" builds both ARM plus 32-bit x86 packages

  <target-systems>
    List of operating systems for which to create packages.
    Default is android-only, which is supported on Apple OSX, Linux and Windows
    Creating Windows MSIs is supported on Microsoft Windows only.
    Example: --platforms="android windows"

  <version-spec>
    * Channel name, i.e. stable/beta/canary
    * Version number, e.g. 14.43.343.25
    * Path to release, e.g. $HOME/Downloads/crosswalk-14.43.343.25.zip
    * Path to build, e.g. crosswalk/src/out/Release/xwalk_app_template
    When passing a local file or directory, only the contained ABIs can be built.
    See <target-archs> for details.

  <windows-conf>
    Quoted string with extra config, e.g. "google-api-key:<name>"
    where <name> is the keyset in ~/.crosswalk-app-tools-keys.json

  Environment variables
    CROSSWALK_APP_TOOLS_CACHE_DIR=<path>: Keep downloaded files in this dir
```
### Example: Creating and packaging an application

To get started, all you need is a web manifest, and an html file. The web manifest holds name and settings for your application. A minimal manifest.json looks like this:
```
{
  "name": "My first Crosswalk application",
  "start_url": "index.html",
  "xwalk_package_id": "com.example.foo"
}
```

Then add an index.html in the same directory:
```
<html>
  <head>
    <title>My first Crosswalk application</title>
  </head>
  <body>This is my first Crosswalk application</body>
</html>
```

Finally, time to create the APK package:
```
crosswalk-pkg <path>
```
Creation of an MSI package on Windows:
```
crosswalk-pkg -p windows <path>
```
This sets up a skeleton project, downloads and imports Crosswalk, and creates a package using the files above.


### Next steps and limitations
* Android release packages will have to be signed manually before they are published on Google's Play Store, as that functionality is not yet integrated. See https://developer.android.com/tools/publishing/app-signing.html#signing-manually for details.
* We encourage everyone to use this app-tools and appreciate feedback, as we are looking to improve user friendliness and integration with Crosswalk in the coming releases.

### Additional target platforms
There is forthcoming support for additional target platforms. For iOS packaging, see 
https://github.com/crosswalk-project/crosswalk-app-tools-ios.

### Run development versions from git

1. Download: `npm install https://github.com/crosswalk-project/crosswalk-app-tools.git`
4. The main script is `crosswalk-app-tools/src/crosswalk-pkg`. Set environment PATH or invoke with directory.


### License

The license for this project is the Apache License Version 2.0, please refer to the LICENSE-APACHE-V2 included with the package for details.
