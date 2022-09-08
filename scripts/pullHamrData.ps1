
adb shell run-as com.hamr mkdir /sdcard/dataDir/
adb shell 'cp /data/data/com.hamr/databases/HomeNew.db /sdcard/dataDir/hamr_backup.db'

adb pull /sdcard/dataDir/
adb shell rm -r /sdcard/dataDir/