import RNFS from 'react-native-fs'
import sqldb from '../misc/database'

const HEADER_SIZE = 512
const FILE_SIZE_OFFSET = 124

const Images = {
  getImage: function (sku) {
    return new Promise((resolve) => {
     const query = "SELECT TarOffset FROM ImageRef WHERE SkuNum='" + sku + "'"
      sqldb.getImage(sku).then((results) => {
        if (results.length == 0) {
          resolve(null)
        } else {
          const image = readImage(parseInt(results.item(0).TarOffset))
          resolve(image)
        }
      })
    })
  }
}

function readImage (offset) {
  return new Promise((resolve) => {
    const filePath = RNFS.DocumentDirectoryPath + '/Images.tar'
    const fileSizePosition = offset + FILE_SIZE_OFFSET
    RNFS.read(filePath, 11, fileSizePosition).then((fileSizeStr) => {
      const fileSize = parseInt(fileSizeStr.trim(), 8)
      const imagePos = offset + HEADER_SIZE
      RNFS.read(filePath, fileSize, imagePos, 'base64')
        .then((image) => {
          resolve(image)
        })
        .catch((err) => {
          console.error('Error reading image: ' + err)
          resolve(null)
        })
    })
  })
}

function log (s) {
  const debug = false
  if (debug) {
    console.log(s)
  }
}

export default Images
