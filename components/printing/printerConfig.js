import Bluetooth from './bluetooth'
import loadLocalRawResource from 'react-native-local-resource'
import consolab from '../../assets/print/consolab.txt'
import upcForm from '../../assets/print/UPC1UpPB32.txt'
import shelfForm from '../../assets/print/SL1UpPB32.txt'
import upcFormZ from '../../assets/print/UPCZebra.txt'
import shelfFormZ from '../../assets/print/SLZebra.txt'
import translate from '../../translations/langHelpers';

export default PrinterConfig = {
    loadForm: async function(labelType,printType) {
        return new Promise(async (resolve) => {
            if (labelType == "upc" && printType == "pb32" ) {
                loadLocalRawResource(upcForm).then(async (formData) => {
                    console.log("FORM DATA: ");
                    console.log(formData);
                    resolve(await Bluetooth.Write(formData));
                })
                .catch(err => {
                    console.log("Load Form Error: " + err);
                    resolve(false);
                })
            }   else if (labelType == "upc" && printType == "zebra" ) {
                loadLocalRawResource(upcFormZ).then(async (formData) => {
                    console.log("FORM DATA: ");
                    console.log(formData);
                    resolve(await Bluetooth.Write(formData));
                })
                .catch(err => {
                    console.log("Load Form Error: " + err);
                    resolve(false);
                })
            }else if (labelType == "shelf" && printType == "zebra" ) {
                loadLocalRawResource(shelfFormZ).then(async (formData) => {
                    console.log("FORM DATA: ");
                    console.log(formData);
                    resolve(await Bluetooth.Write(formData));
                })
                .catch(err => {
                    console.log("Load Form Error: " + err);
                    resolve(false);
                })
            }
            else if (labelType == "shelf" && printType == "pb32" )  {
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