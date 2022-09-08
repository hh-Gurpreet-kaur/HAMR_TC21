import RNFS from 'react-native-fs'
import sqldb from '../misc/database'

const HEADER_SIZE = 512;
const FILE_SIZE_OFFSET = 124 

let Images = {
    getImage: function(sku) {
        return new Promise(resolve => {
            let query = "SELECT TarOffset FROM ImageRef WHERE SkuNum='" + sku + "'";
            sqldb.getImage(sku).then((results) => {
                if (results.length == 0) {
                    resolve(null);
                } else {
                    let image = readImage(parseInt(results.item(0).TarOffset));
                    resolve(image);
                }

            })
        })
        
    }
    
}

function readImage(offset) {
    return new Promise(resolve => {
        let filePath = RNFS.DocumentDirectoryPath + "/Images.tar";
        let fileSizePosition = offset + FILE_SIZE_OFFSET;
        RNFS.read(filePath, 11, fileSizePosition)
        .then(fileSizeStr => {
            let fileSize = parseInt(fileSizeStr.trim(), 8);
            let imagePos = offset + HEADER_SIZE;
            RNFS.read(filePath, fileSize, imagePos, 'base64')
            .then(image => {
                resolve(image)
            })
            .catch(err => {
                console.error("Error reading image: " + err);
                resolve(null);
            });
        });
    });
}

function log(s) {
    let debug = false;
    if (debug) {
        console.log(s)
    }
}

export default Images;