import RNFS from 'react-native-fs'

const config = {
    dbPath: RNFS.DocumentDirectoryPath + '/../databases/',
    dbName: 'HomeNew.db',
    imageDbName: 'ImageLinks.db',
    debugIntegrated: false,
    easyAccess: __DEV__,
    backupIP: "10.204.11.75",
    backupLocation: "/home/mobile/backup/"
    
} 

export default config;