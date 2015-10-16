Crosswalk-app-tools
===================

Crosswalk-app-tools is our forthcoming packaging tool for creating Crosswalk applications. We are inviting early adopters to build their web applications using crosswalk-app-tools, and provide feedback for future improvements.


### Installation

The tools are cross-platform by virtue of being based on Node.js. We are supporting Microsoft Windows, Apple OS X and Linux as host operating systems.

The following components are required
  1. Node.js and NPM
  2. Android SDK with 5.0 (target-21) or later installed, plus Java JDK and Apache Ant for creating Android APK packages

In order to get the tools available from the command-line easily, global npm installation is recommended.

Microsoft Windows: `npm install -g crosswalk-app-tools`

Apple OS X and Linux: `sudo npm install -g crosswalk-app-tools`

The best way to check if a machine has all the required dependencies is to create and build a plain empty Android app 
on the system. If this does not work, then building Crosswalk apps will not succeed either. App-tools provides a command for doing this:

```
crosswalk-app check android
```

### Usage

```
  Crosswalk Project Packaging Tool -- https://crosswalk-project.org
  Usage: crosswalk-pkg <options> <path>

  <options>
    -c --crosswalk=<version-spec>: Runtime version
    -h --help: Print usage information
    -p --platforms=<android|windows>: Target platform
    -r --release=true: Build release packages
    -v --version: Print tool version

  <path>
    Path to directory that contains a web app

  <version-spec>
    * Channel name, i.e. "stable". "beta", or "canary"
    * Version number, e.g. 14.43.343.25
    * Path to release, e.g. $HOME/Downloads/crosswalk-14.43.343.25.zip

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

Finally, time to create the apk package:
```
crosswalk-pkg <path>
```
This sets up a skeleton project, downloads and imports Crosswalk, and creates a package using the files above.


### Next steps and limitations
* Android release packages will have to be signed manually before they are published on Google's Play Store, as that functionality is not yet integrated.
* We encourage everyone trying this softare and appreciate feedback, as we are looking to improve user friendliness and integration with Crosswalk in the coming releases.


### Run development versions from git

1. Download: `npm install https://github.com/crosswalk-project/crosswalk-app-tools.git`
4. The main script is `crosswalk-app-tools/src/crosswalk-pkg`. Set environment PATH or invoke with directory.


### License

The license for this project is the Apache License Version 2.0, please refer to the LICENSE-APACHE-V2 included with the package for details.
