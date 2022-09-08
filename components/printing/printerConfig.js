import Bluetooth from './bluetooth'
import loadLocalRawResource from 'react-native-local-resource'
import consolab from '../../assets/print/consolab.txt'
import upcForm from '../../assets/print/UPC1UpPB32.txt'
import shelfForm from '../../assets/print/SL1UpPB32.txt'
import translate from '../../translations/langHelpers';

export default PrinterConfig = {
    loadForm: async function(labelType) {
        return new Promise(async (resolve) => {
            if (labelType == "upc") {
                loadLocalRawResource(upcForm).then(async (formData) => {
                    console.log("FORM DATA: ");
                    console.log(formData);
                    resolve(await Bluetooth.Write(formData));
                })
                .catch(err => {
                    console.log("Load Form Error: " + err);
                    resolve(false);
                })
            } else {
                console.log("SHELF FORM: " + shelfForm);
                loadLocalRawResource(shelfForm).then(async (formData) => {
                    console.log("FORM DATA: ");
                    console.log(formData);
                    resolve(await Bluetooth.Write(formData));
                })
                .catch(err => {
                    console.log("Load Form Error: " + err);
                    resolve(false)
                });
            }
           

        })
    
    },

    sendFonts: async function(printerAddress) {
        if (printerAddress == '' || printerAddress == null) {
            return new Promise((resolve) => { resolve(
                translate('no_printer_selected')
            ) });
        }

		if (!(await Bluetooth.BluetoothEnabled())) {
            return new Promise((resolve) => { resolve(
                translate('bluetooth_disabled')
            ) });
        }

        if (await Bluetooth.IsConnected() === false) {
   
            if (!(await Bluetooth.Connect(printerAddress))) {

                console.log("Connection failed");
                return new Promise((resolve) => { resolve(
                    translate('connection_failed')
                    ) });
            }

        }

        return new Promise(async (resolve) => {
            loadLocalRawResource(consolab).then(async (font) => {
                resolve(await Bluetooth.Write(font));
            })
            .catch(err => {
                console.log("Load Form Error: " + err);
                resolve(false)
            });
        });

        
    }
}