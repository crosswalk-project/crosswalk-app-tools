Crosswalk-app-tools
===================

Command line tools to create and package Crosswalk applications. The license for this project is Apache License
Version 2.0, please refer to the LICENSE-APACHE-V2 included with the package.

Crosswalk-app-tools is in early stages of development, and not suitable for use in a production environment. Preliminary releases and announcements are made available as a technology preview only. No packages are being published at this time, but git tags serve as reference points for release milestones.

### Installation

Crosswalk-app-tools is cross-platform by virtue of being based on Node.js. However at this point most testing is done on Linux, so we expect the least number of hickups there. In any case we have seen reports of successful runs on Apple OS X, and are looking forward to hearing about adventurous individuals giving it a spin on Microsoft Windows as well. (But be warned that there are known problems with proxy support on Windows, for starters)

The following components are required
  1. Android SDK with 5.0 (target-21) installed
  2. Java JDK and Apache Ant
  3. Node.js and NPM

The best way to check if a machine has all the required dependencies is to create build a plain empty Android app 
on the system. If this does not work, then building Crosswalk apps will not succeed either.

```
android create project -a MainActivity -k com.example.foo -p com.example.foo -t android-21
cd com.example.foo
ant debug
```

In order to get the `crosswalk-app` script available everywhere, global npm installation is required. On most Linux distributions this can be achieved by using `sudo`.
```
sudo npm install -g crosswalk-app-tools
```

### Usage

```
Crosswalk Application Project and Packaging Tool

    crosswalk-app create <package-id>		    Create project <package-id>

    crosswalk-app build [release|debug]		    Build project to create packages
                                       		    Defaults to debug when not given

    crosswalk-app update <channel>|<version>    Update Crosswalk to latest in named
                                                channel, or specific version

    crosswalk-app help				            Display usage information

    crosswalk-app version			            Display version information

Options for platform 'android'

    For command 'create'
        --android-crosswalk    			        Channel name (stable/beta/canary)
						                        or version number (w.x.y.z)
Environment Variables

    CROSSWALK_APP_TOOLS_CACHE_DIR		        Keep downloaded files in this dir
```
#### Example: Create App
`crosswalk-app create com.example.foo`: This sets up a skeleton project in directory com.example.foo/, downloads and imports Crosswalk, and puts a sample "hello world" web app under com.example.foo/app/.

#### Example: Build App
`cd com.example.foo` and then `crosswalk-app build` builds packages. The APKs can be found under pkg/ when done.

#### Example: Update Crosswalk
`crosswalk-app update stable` updates Crosswalk to the latest version available in the stable channel.

### Limitations
* This is alpha stage software and under continuous development. We encourage trying it and appreciate feedback, but use in a production environment is not supported at this point in time.

### Run development versions from git

1. Download: `git clone https://github.com/crosswalk-project/crosswalk-app-tools.git`
3. Install dependencies: `cd crosswalk-app-tools`, then `npm install`, and `cd ..`
4. The main script is `crosswalk-app-tools/src/crosswalk-app`. Set environment PATH or invoke with directory.

