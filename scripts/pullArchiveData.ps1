
adb shell run-as com.hamr mkdir /sdcard/archiveDir/
adb shell 'cp /data/data/com.hamr/files/archive/* /sdcard/archiveDir/'

adb pull /sdcard/archiveDir/
adb shell rm -r /sdcard/archiveDir/