import Bluetooth from '../printing/bluetooth'
import sqldb from '../misc/database'
import { translate } from '../../translations/langHelpers'

import ShelfLabel from './shelfLabel'
import UpcLabel from './upcLabel'
import ShelfLabelZebra from './shelfLZebra'
import UpcLabelZebra from './UPCLZebra'

export default class Label {
  static async PrintLabel (type,printtype,sku, printerAddress) {
    if (printerAddress == '' || printerAddress == null) {
      return new Promise((resolve) => {
        resolve(
          translate('no_printer_selected')
        )
      })
    }

    if (!(await Bluetooth.BluetoothEnabled())) {
      return new Promise((resolve) => {
        resolve(
          translate('bluetooth_disabled')
        )
      })
    }

    if (await Bluetooth.IsConnected() === false) {
      if (!(await Bluetooth.Connect(printerAddress))) {
        console.log('Connection failed')
        return new Promise((resolve) => {
          resolve(
            translate('connection_failed')
          )
        })
      }
    }

    let query = ''
    if (type == 'shelf') {
      query = `SELECT ItemMaster.SkuNum,
                ItemMaster.MfgNum,
                ItemMaster.Description,
                ItemMaster.RetailUnit,
                ItemMaster.RetailPrice,
                ItemMaster.HomeRetailPrice,
                Upc.UpcCode,
                Upc.Active
                FROM ItemMaster
                LEFT JOIN Upc ON Upc.SkuNum = ItemMaster.SkuNum
                WHERE ItemMaster.SkuNum='${sku}'
                ORDER BY Upc.Active DESC
                `
    } else if (type == 'upc') {
      query = `SELECT ItemMaster.SkuNum,
                ItemMaster.MfgNum,
                ItemMaster.Description
                FROM ItemMaster
                WHERE ItemMaster.SkuNum='${sku}'
                `
    }

    let success = ''
    success = await this.getResults(type, printtype,query)
    return new Promise((resolve) => {
      resolve(success)
    })
  }

  static async getResults (type,printtype,query) {
    const results = await sqldb.executeReader(query)

    if (results.length == 0) {
      return new Promise((resolve) => {
        resolve(false)
      })
    } else {
      let data = ''
      let result = false
   
      if (type == 'shelf' && printtype == 'pb32' ) {
        data = ShelfLabel.parseResults(results)
        result = await PrinterConfig.loadForm('shelf','pb32')
      } else if (type == 'upc' && printtype == 'pb32') {
        data = UpcLabel.parseResults(results)
        result = await PrinterConfig.loadForm('upc','pb32')
      }
     else if (type == 'shelf' && printtype == 'zebra') {
        data = ShelfLabelZebra.parseResults(results)
        result = await PrinterConfig.loadForm('shelf','zebra')
      } 
      else if (type == 'upc' && printtype == 'zebra') {
        data = UpcLabelZebra.parseResults(results)
        result = await PrinterConfig.loadForm('upc','zebra')
      }
    
      if (result) {
        if (await Bluetooth.Write(data)) {
          return new Promise((resolve) => {
            resolve(true)
          })
        } else {
          return new Promise((resolve) => {
            resolve(false)
          })
        }
      } else {
        return new Promise((resolve) => {
          resolve('Error loading template. Unable to print.')
        })
      }
    }
  }
}
