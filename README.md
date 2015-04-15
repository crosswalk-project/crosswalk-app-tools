Crosswalk-app-tools
===================

Command line tools to create and package Crosswalk applications. The license for this project is Apache License
Version 2.0, please refer to the LICENSE-APACHE-V2 included with the package.

Crosswalk-app-tools is in very early stages of development, and not suitable for use in a production environment. "Releases" and announcements are made available as a technology preview only. No packages are being published at this time, but git tags serve as reference points for release milestones.

### Preparation

Linux is the only tested platform. Node.js, the Android SDK, and git must be functional.

1. Download: `git clone https://github.com/crosswalk-project/crosswalk-app-tools.git`
2. Optionally select a version: `git checkout 0.1.0`
3. Install dependencies: `cd crosswalk-app-tools`, then `npm install`, and `cd ..`
4. The main script is `crosswalk-app-tools/bin/crosswalk-app`. Set environment PATH or invoke with directory.
5. Download Crosswalk, e.g. https://download.01.org/crosswalk/releases/crosswalk/android/stable/8.37.189.14/crosswalk-8.37.189.14.zip to the same directory.

Your current directory should have those entries now.
```
drwxrwxr-x. 11 user user     4096 Dec  1 15:43 crosswalk-app-tools
-rw-rw-r--. 1  user user 35043139 Sep 30 11:43 crosswalk-8.37.189.12.zip
```

### Usage

```
Crosswalk Application Project and Packaging Tool

    crosswalk-app create <package-id>		Create project <package-id>
                         --crosswalk=<path>	Use downloaded Crosswalk
                         --channel=<name>	Release channel: stable|beta|canary

    crosswalk-app build [release|debug]		Build project to create packages
                                       		Defaults to debug when not given

    crosswalk-app update <channel>|<version>    Update Crosswalk to latest in named
                                                channel, or specific version

    crosswalk-app help				Display usage information

    crosswalk-app version			Display version information
```
#### Example: Create App
`crosswalk-app create com.example.foo`: This sets up a skeleton project in directory com.example.foo/, downloads and imports Crosswalk, and puts a sample "hello world" web app under com.example.foo/app/.

#### Example: Build App
`cd com.example.foo` and then `crosswalk-app build` builds packages. The APKs can be found under pkg/ when done.

#### Example: Update Crosswalk
`crosswalk-app update stable` updates Crosswalk to the latest version available in the stable channel.

### Limitations
* This is alpha stage software and under continuous development. We encourage trying it and appreciate feedback, but use in a production environment is not supported at this point in time.
* A problem prevents use with anyting but releases from the "stable" crosswalk channel. 
