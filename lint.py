#!/usr/bin/env python
import os
import sys
import commands
import shutil
from optparse import OptionParser
import urllib2
import re
from bs4 import BeautifulSoup
import platform

os.system("node -v")
SCRIPT_PATH = os.path.dirname(os.path.realpath(__file__))
crosswalk_test_suite = os.path.join(SCRIPT_PATH, "crosswalk-test-suite")
tmp = os.path.join(SCRIPT_PATH, "tmp")
apptools = os.path.join(crosswalk_test_suite, "apptools")
apptools_android_tests = os.path.join(tmp, "apptools-android-tests")
apptools_windows_tests = os.path.join(tmp, "apptools-windows-tests")
apptools_ios_tests = os.path.join(tmp, "apptools-ios-tests")

os.environ['CROSSWALK_APP_SRC'] = os.path.join(SCRIPT_PATH, "src") + "/"

returnCode = 0
if os.path.exists(crosswalk_test_suite):
    os.chdir(crosswalk_test_suite)
    cmd = 'git pull'
    returnCode = os.system(cmd)
    os.chdir(SCRIPT_PATH)
else:
    cmd = 'git clone -b apptools-fixes https://github.com/rakuco/crosswalk-test-suite'
    returnCode = os.system(cmd)
if returnCode == 1:
    sys.exit(1)

if os.path.exists(tmp):
    shutil.rmtree(tmp)

def crosswalk_version(channel, platform):
    htmlDoc = urllib2.urlopen(
        'https://download.01.org/crosswalk/releases/crosswalk/' + platform + '/' +
        channel +
        '/').read()
    soup = BeautifulSoup(htmlDoc)
    alist = soup.find_all('a')
    version = ''
    for  index in range(-1, -len(alist)-1, -1):
        aEle = alist[index]
        version = aEle['href'].strip('/')
        if re.search('[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*', version):
            break
    return version

def main():
    usage = "Usage: ./lint.py -p android"
    opts_parser = OptionParser(usage=usage)
    opts_parser.add_option(
        "-p",
        dest="platform",
        help="specify the testsuit platform, e.g. android, windows, ios")
    opts_parser.add_option(
        "-a",
        dest="arch",
        help="specify the packing apk bit, e.g. 32bit, 64bit")
    global BUILD_PARAMETERS
    (BUILD_PARAMETERS, args) = opts_parser.parse_args()
    if BUILD_PARAMETERS.platform == "android":
        os.environ['CROSSWALK_APP_TOOLS_CACHE_DIR'] = os.path.join(apptools_android_tests, "tools")
        x = []
        for i in list(os.popen('adb devices -l'))[1:]:
            if i.strip(os.linesep) != "" and i.strip(os.linesep).split(" ")[0] != "*":
                x.append(i.strip(os.linesep).split(" ")[0])
        if x:
            os.environ['DEVICE_ID'] = ",".join(x)
        os.environ['SKIP_EMULATOR'] = "True"
        android_crosswalk_version = crosswalk_version("stable", BUILD_PARAMETERS.platform)
        shutil.copytree(os.path.join(apptools, "apptools-android-tests"), apptools_android_tests)
        fp = open(apptools_android_tests + '/arch.txt', 'w+')
        fp.write("arm")
        fp.close()
        if platform.system() != "Linux":
            hp = open(apptools_android_tests + "/host.txt", 'w+')
            hp.write("Windows")
            hp.close()
        else:
            hp = open(apptools_android_tests + "/host.txt", 'w+')
            hp.write("Android")
            hp.close()
        if BUILD_PARAMETERS.arch == "64bit":
            vp_64 = open(apptools_android_tests + "/version.txt", 'w+')
            vp_64.write(android_crosswalk_version + " 64")
            vp_64.close()
            os.chdir(os.path.join(apptools_android_tests, "tools"))
            data = urllib2.urlopen("https://download.01.org/crosswalk/releases/crosswalk/" + BUILD_PARAMETERS.platform + "/stable/" + android_crosswalk_version + "/crosswalk-" + android_crosswalk_version + "-64bit.zip").read()
            with open("crosswalk-" + android_crosswalk_version + "-64bit.zip", 'wb') as f:
                f.write(data)
        else:
            vp_32 = open(apptools_android_tests + "/version.txt", 'w+')
            vp_32.write(android_crosswalk_version + " 32")
            vp_32.close()
            os.chdir(os.path.join(apptools_android_tests, "tools"))
            data = urllib2.urlopen("https://download.01.org/crosswalk/releases/crosswalk/" + BUILD_PARAMETERS.platform + "/stable/" + android_crosswalk_version + "/crosswalk-" + android_crosswalk_version + ".zip").read()
            with open("crosswalk-" + android_crosswalk_version + ".zip", 'wb') as f:
                f.write(data)
        os.chdir(os.path.join(os.path.join(apptools_android_tests, "apptools"), "CI"))
        if platform.system() != "Linux":
            retval = os.system("python -m unittest discover --pattern=crosswalk_pkg_basic.py > null")
        else:
            retval = os.system("python -m unittest discover --pattern=*.py > null")
    elif BUILD_PARAMETERS.platform == "windows":
        os.environ['CROSSWALK_APP_TOOLS_CACHE_DIR'] = os.path.join(apptools_windows_tests, "tools")
        shutil.copytree(os.path.join(apptools, "apptools-windows-tests"), apptools_windows_tests)
        os.chdir(os.path.join(apptools_windows_tests, "tools"))
        windows_crosswalk_version = crosswalk_version("canary", BUILD_PARAMETERS.platform)
        try:
            data = urllib2.urlopen("https://download.01.org/crosswalk/releases/crosswalk/" + BUILD_PARAMETERS.platform + "/canary/" + windows_crosswalk_version + "/crosswalk-" + windows_crosswalk_version + ".zip").read()
            with open("crosswalk-" + windows_crosswalk_version + ".zip", 'wb') as f:
                f.write(data)
        except Exception as e:
            data = urllib2.urlopen("https://download.01.org/crosswalk/releases/crosswalk/" + BUILD_PARAMETERS.platform + "/canary/" + windows_crosswalk_version + "/crosswalk64-" + windows_crosswalk_version + ".zip").read()
            with open("crosswalk64-" + windows_crosswalk_version + ".zip", 'wb') as f:
                f.write(data)
        os.chdir(os.path.join(os.path.join(apptools_windows_tests, "apptools"), "CI"))
        retval = os.system("python -m unittest discover --pattern=*.py > null")
    elif BUILD_PARAMETERS.platform == "ios":
        shutil.copytree(os.path.join(apptools, "apptools-ios-tests"), apptools_ios_tests)
        os.chdir(os.path.join(os.path.join(apptools_ios_tests, "apptools"), "CI"))
        retval = os.system("python -m unittest discover --pattern=*.py > null")
    return retval

if __name__ == "__main__":
    sys.exit(main())
