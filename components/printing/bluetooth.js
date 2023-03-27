import BluetoothSerial from 'react-native-bluetooth-serial'

const Bluetooth = {
  BluetoothEnabled: function () {
    return new Promise(resolve => {
      BluetoothSerial.isEnabled()
        .then((enabled) => {
          if (!enabled) { resolve(false) } else { resolve(true) }
        }, (err) => {
          resolve(false)
        })
    })
  },

  ScanDevices: function (printerAddress) {
    let deviceFound = false
    return new Promise(resolve => {
      BluetoothSerial.discoverUnpairedDevices()
        .then((unpairedDevices) => {
          for (let i = 0; i < unpairedDevices.length; i++) {
            const element = unpairedDevices[i]
            if (element.id == printerAddress) {
              console.log('Connecting to ' + printerAddress)
              deviceFound = true
              resolve(true)
              break
            } else {
              console.log('Ignoring ' + element.address)
            }
          }
          if (!deviceFound) {
            resolve(false)
          }
        }, (er) => {
          console.log('error' + JSON.stringify(er))
          resolve(false)
        })
    })
  },

  Pair: function (printerAddress) {
    return new Promise(resolve => {
      BluetoothSerial.pairDevice(printerAddress)
        .then((msg) => {
          console.log('msg pair')
          console.log(msg)
          resolve(true)
        }, (e) => {
          console.log('Pair Error: ' + e)
          resolve(false)
        })
    })
  },

  Connect: function (printerAddress) {
    return new Promise(resolve => {
      BluetoothSerial.connect(printerAddress)
        .then((msg) => {
          console.log('msg connect')
          console.log(msg)
          resolve(msg)
        }, (e) => {
          console.log('Connect Error: ' + e)
          resolve(false)
        })
    })
  },

  IsConnected: function () {
    return new Promise(resolve => {
      BluetoothSerial.isConnected()
        .then((isConnected) => {
          console.log('Is connected msg: ' + isConnected)
          resolve(isConnected)
        }, (e) => {
          console.log('Error msg: ' + e)
          resolve(false)
        })
    })
  },

  Write: function (data) {
    return new Promise(resolve => {
      BluetoothSerial.write(data)
        .then((res) => {
          resolve(true)
        }, (err) => {
          console.log('Write Error: ' + err)
          resolve(false)
        })
    })
  }

}

export default Bluetooth
