import Scanning from '../misc/scanning'
import Bluetooth from '../printing/bluetooth'
import PrinterConfig from './printerConfig'
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
const MaxnumLength = 7;
const NewLine = '\n';

class ShelfLabel {

    /*static async PrintLabel(sku) {
        
        let query = `SELECT ItemMaster.SkuNum,
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
            `;
        
        let success = "";
        success = await this.getResults(query);
        return new Promise((resolve) => { 
            resolve(success);
        });
            
    }

    static async getResults(query) {

        let results = await sqldb.executeReader(query);

        if (results.length == 0) {
            return new Promise((resolve) => { 
                resolve(false);
            });
        } else {
            let data = this.parseResults(results);
            let result = await PrinterConfig.loadForm("shelf");
            if (result) {
                if (await Bluetooth.Write(data)) {
                    return new Promise((resolve) => { 
                        resolve(true);
                    });
                } else {
                    return new Promise((resolve) => { 
                        resolve(false);
                    });
                }
            } else {
                return new Promise((resolve) => { 
                    resolve("Error loading template. Unable to print.");
                });
            }

        }
    }*/

    static parseResults(results) {
        let item = results.item(0);

        let info = {};
        let price = item.RetailPrice > 0 ? item.RetailPrice : item.HomeRetailPrice;
        let override = "";

        if ((item.RetailPrice > 0) && (item.RetailPrice != item.HomeRetailPrice)) {
            override = item.RetailPrice > item.HomeRetailPrice ? "&+" : "&-";
        }

        let upc = item.UpcCode ? item.UpcCode.toString().slice(-5) : '';

        info = {
            mfgNum: item.MfgNum,
            description: item.Description,
            skuNum: item.SkuNum.toString(),
            retailPrice: price.toString(),
            retailUnit: item.RetailUnit.toString(),
            override: override,
            upc: upc
        }

        let data = this.GetLabel(info);
        
        return data;
    }

    static GetLabel(item) {
        data = "";

        // Header
        this.AddLine(this.BeginLabel());

        // Retail Price
        this.AddLine(this.GetRegularFormat(item.retailPrice));

        // Mfg Number
        this.AddLine(this.GetRegularFormat(item.mfgNum));

        // Description
        this.AddLine(this.SplitDescription(item.description));

        // Retail Unit
        this.AddLine(this.GetRegularFormat(item.retailUnit));

        // Item Number
        this.AddLine(this.SplitSkuNum(item.skuNum));

        // Source code + hazard code placeholder
        this.AddLine(this.GetRegularFormat(''));

        // User defined field
        let nonHomeUpc = item.upc;
        this.AddLine(this.GetRegularFormat(nonHomeUpc.substr(nonHomeUpc.length - 5, 5)));

        // Override
        this.AddLine(this.GetRegularFormat(item.override));

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

    static SplitSkuNum(skuNum) {
        if (MaxnumLength > skuNum.length) {
            return `${StartOfText}${skuNum}${CarriageReturn}${EndOfText}`;
                }
            else {
                return  StartOfText + skuNum.substring(0, 4)+ "-" + skuNum.substring(4, skuNum.length) +CarriageReturn + EndOfText; 
            } 
    
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

export default ShelfLabel;