Crosswalk-app-tools
===================

Command line tools to create and package Crosswalk applications. The license for this project is Apache License
Version 2.0, please refer to the LICENSE-APACHE-V2 included with the package.

Crosswalk-app-tools is in very early stages of development, and not suitable for use in a production environment. "Releases" and announcements are made available as a technology preview only. No packages are being published at this time, but git tags serve as reference points for release milestones.

### Version compatibility

The supported Crosswalk version for Crosswalk-app-tools 0.1.0 (as obtained by `git checkout 0.1.0` below) is Crosswalk 8. Due to changes to Crosswalk internals, newer versions will fail to create usable projects. The master branch of Crosswalk-app-tools is being moved to support Crosswalk 9.

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

`crosswalk-app-tools/bin/crosswalk-app create com.example.Foo`: This sets up a skeleton project in directory com.example.Foo/, imports Crosswalk from the zip, and puts a sample "hello world" web app under com.example.Foo/assets/www/.

`cd com.example.Foo`: move to the project root.

`../crosswalk-app-tools/bin/crosswalk-app build`: Build IA and ARM APKs for the web app. The packages Foo-debug.armeabi-v7a.apk and Foo-debug.x86.apk will end up under bin/.

That's all for now. More to come soon, and if all goes well, NPMs for new years.
