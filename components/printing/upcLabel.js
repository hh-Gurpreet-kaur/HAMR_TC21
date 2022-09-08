import Scanning from '../misc/scanning'
import Bluetooth from '../printing/bluetooth'
import { translate } from '../../translations/langHelpers'
import sqldb from '../misc/database';

// Control Character Codes
//  Control Name                 Acronym       Hex Value
const StartOfText                = "<STX>";      // 01
const EndOfText                  = "<ETX>";      // 02
const FormFeed                   = "<FF>";       // 0C
const CarriageReturn             = "<CR>";       // 0D
const EndOfTransmissionBlock     = "<ETB>";      // 17
const Cancel                     = "<CAN>";      // 18
const Escape                     = "<ESC>";      // 1B
const RecordSeparator            = "<RS>";       // 1E
const UnitSeparator              = "<US>";       // 1F

const MaxLineLength = 18;
const NewLine = '\n';

class UpcLabel {

    /*static async PrintLabel(sku, printerAddress) {
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
                    translate('connection_failed') + " '" + printerAddress + "'."
                    ) });
            }

        }

        return new Promise(resolve => {
            let query = `SELECT ItemMaster.SkuNum,
                ItemMaster.MfgNum,
                ItemMaster.Description
                FROM ItemMaster
                WHERE ItemMaster.SkuNum='${sku}'
                `;

            sqldb.executeReader(query).then((results) => {
                console.log("WE HERE");
                if (results.length == 0) {
                    this.log("No Results found for printing");
                    resolve(false);
                } else {
                    let result = this.parseResults(results);
                    console.log(result);
                    resolve(result);
                }
            })
        });
        
    }*/

    static parseResults(results) {
        let item = results.item(0);

        let info = {};

        info = {
            mfgNum: item.MfgNum,
            description: item.Description,
            skuNum: item.SkuNum.toString(),
        }

        let data = this.GetLabel(info);
            
        return data;
    }

    static GetLabel(item) {
        data = "";

        // Header
        this.AddLine(this.BeginLabel());

        // Mfg Number
        this.AddLine(this.GetRegularFormat(item.mfgNum));

        // Description
        this.AddLine(this.SplitDescription(item.description));

        // Item Number
        this.AddLine(this.GetRegularFormat(item.skuNum));

        // Source code + hazard code placeholder
        this.AddLine(this.GetRegularFormat(''));

        // Home Hardware Upc code
        let hhUpc = Scanning.getHHUpc(item.skuNum);
        this.AddLine(this.GetRegularFormat(hhUpc));

        // Trailer
        this.AddLine(this.EndLabel());

        return data;
    }

    // Manual splitting of description
    static SplitDescription(desc) {
        if (MaxLineLength >= desc.length) {
            return StartOfText + CarriageReturn + EndOfText + NewLine +
                StartOfText + desc + CarriageReturn + EndOfText;
        }

        let splitPos = this.findSplitPos(desc);

        if ((splitPos > 0) && (MaxLineLength >= desc.length - splitPos)) {
            return StartOfText + desc.substring(splitPos).trim() + 
                CarriageReturn + EndOfText + NewLine + 
                StartOfText + desc.substring(0, splitPos).trim() +
                CarriageReturn + EndOfText;
        } else {
            return StartOfText + desc.substring(MaxLineLength) + 
                CarriageReturn + EndOfText + NewLine + 
                StartOfText + desc.substring(0, MaxLineLength) +
                CarriageReturn + EndOfText; 
        }

    }

    static findSplitPos(text) {
        let preferedSplitChars = [ ' ', ',', '+' ];
        let splitPos = 0;

        for (let i = 0; i < preferedSplitChars.length; i++) {
            const splitChar = preferedSplitChars[i];
            let currSplitPos = text.lastIndexOf(splitChar, MaxLineLength - 1) + 1;

            if (currSplitPos > splitPos) {
                splitPos = currSplitPos;
            }
        }

        return splitPos;
    }


    static AddLine(line) {
        data += line + NewLine;
    }

    static BeginLabel() {
        return `${StartOfText}${Escape}E*${Cancel}${EndOfText}`;
    }

    static EndLabel() {
        return `${StartOfText}${RecordSeparator}1${UnitSeparator}1${EndOfTransmissionBlock}${FormFeed}${EndOfText}`;
    }

    static GetRegularFormat(text) {
        return `${StartOfText}${text}${CarriageReturn}${EndOfText}`;
    }
}

export default UpcLabel;