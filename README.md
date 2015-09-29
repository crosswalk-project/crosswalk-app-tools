Crosswalk-app-tools
===================

Command line tools to create and package Crosswalk applications. The license for this project is Apache License
Version 2.0, please refer to the LICENSE-APACHE-V2 included with the package.

Crosswalk-app-tools is our forthcoming packaging tool for creating Crosswalk applications. We are inviting early adopters to build their web applications using crosswalk-app-tools, and provide feedback for future improvements.


### Installation

Crosswalk-app-tools is cross-platform by virtue of being based on Node.js. We are supporting Microsoft Windows, Apple OS X and Linux (testing is mostly done on Fedora and Ubuntu distributions).

The following components are required
  1. Node.js and NPM
  2. WiX Toolset (http://wixtoolset.org) for creating Windows MSI installers
  3. Android SDK with 5.0 (target-21) installed, plus Java JDK and Apache Ant for creating Android APK packages

The best way to check if a machine has all the required dependencies is to create and build a plain empty Android app 
on the system. If this does not work, then building Crosswalk apps will not succeed either.

```
android create project -a MainActivity -k com.example.foo -p com.example.foo -t android-21
cd com.example.foo
ant debug
```

In order to get the `crosswalk-app` script available everywhere, global npm installation is required.
```
Microsoft Windows: npm install -g crosswalk-app-tools
Apple OS X and Linux: sudo npm install -g crosswalk-app-tools
```


### Usage

```
Crosswalk Project Application Packaging Tool

    crosswalk-app create <package-id>           Create project <package-id>
                  --platforms=<target>          Optional, e.g. "windows"

    crosswalk-app build [release|debug] [<dir>] Build project to create packages
                                                Defaults to "debug" when not given
                                                Tries to build in current dir by default

    crosswalk-app update <channel>|<version>    Update Crosswalk to latest in named
                                                channel, or specific version

    crosswalk-app platforms                     List available target platforms

    crosswalk-app help                          Display usage information

    crosswalk-app version                       Display version information

Options for platform 'android'

    For command 'create'
        --android-crosswalk    	                Channel name (stable/beta/canary)
                                                or version number (w.x.y.z)
Environment variables for platform 'android'

    CROSSWALK_APP_TOOLS_CACHE_DIR               Keep downloaded files in this dir
```
#### Example: Create App
`crosswalk-app create com.example.foo`: This sets up a skeleton project in directory com.example.foo/, downloads and imports Crosswalk, and puts a sample "hello world" web app under com.example.foo/app/.

#### Example: Build App
`cd com.example.foo` and then `crosswalk-app build` builds packages. The APKs can be found in the current directory when done.

#### Example: Update Crosswalk
`crosswalk-app update stable` updates Crosswalk to the latest version available in the stable channel.


### Limitations
* Android release packages will have to be signed manually before they are published on Google's Play Store, as that functionality is not yet integrated.
* This is alpha stage software and under continuous development. We encourage trying it and appreciate feedback, but use in a production environment is not supported at this point in time.


### Run development versions from git

1. Download: `git clone https://github.com/crosswalk-project/crosswalk-app-tools.git`
3. Install dependencies: `cd crosswalk-app-tools`, then `npm install`, and `cd ..`
4. The main script is `crosswalk-app-tools/src/crosswalk-app`. Set environment PATH or invoke with directory.

