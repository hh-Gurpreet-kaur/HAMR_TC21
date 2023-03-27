import Scanning from '../misc/scanning'
import Bluetooth from '../printing/bluetooth'
import { translate } from '../../translations/langHelpers'
import sqldb from '../misc/database';

// Control Character Codes
//  Control Name                 Acronym       
const StartOfText                = "^XA";      
const EndOfText                  = "^XZ";       
const PrintOrientation                  = "^POI";    
const FormFeed                   = "^XFR:SAMPLE.GRF";       
const FieldNum1            = "^FN1^FD";   
const FieldNum2             = "^FN2^FD";       
const FieldNum3              = "^FN3^FD";      
const FieldNum4             = "^FN4^FD"; 
const FieldNum7             = "^FN7^FD"; 
const FieldNum6                    = "^FN6^FD";       
const FieldNum5                     = "^FN5^FD";       
const FieldNum8            = "^FN8^FD";   
const FieldNum9           = "^FN9^FD";   
const FieldSeparator              = "^FS";       
const font              = "^CF0,30";      

const MaxLineLength = 18;
const MaxnumLength = 7;
const NewLine = '\n';

class UpcLabelZebra {

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
        let hhUpc = Scanning.getHHUpc(item.skuNum);
       this.AddLine(this.SplitDescriptionn(item.description,
           item.mfgNum, hhUpc,item.skuNum ));

        // Trailer
        this.AddLine(this.EndLabel());

        return data;
    }
    static SplitDescriptionn(desc,mfgnum,upcbarcode,sku) {
   
        return  StartOfText + PrintOrientation+FormFeed+this.SplitDescription(desc)
        +FieldNum3 +mfgnum+FieldSeparator+
        NewLine + 
        FieldNum4 + upcbarcode+FieldSeparator+ 
          NewLine +
         this.SplitSkuNum(sku)+
          EndOfText; 
}
    // Manual splitting of description
    static SplitDescription(desc) {
        if (MaxLineLength >= desc.length) {
            
                return  FieldNum1 + desc+FieldSeparator;
                }
       let splitPos = this.findSplitPos(desc);
    
            if ((splitPos > 0) && (MaxLineLength >= desc.length - splitPos)) {
               // return desc.substring(splitPos).trim() + desc.substring(0, splitPos).trim()
                 return FieldNum2 + desc.substring(splitPos).trim()+FieldSeparator + NewLine + 
                 FieldNum1  + desc.substring(0, splitPos).trim() +FieldSeparator; 
            } else {
               // return desc.substring(MaxLineLength) + desc.substring(0, MaxLineLength)
                return  FieldNum2  + desc.substring(MaxLineLength) +FieldSeparator+
                   NewLine + 
                   FieldNum1 + desc.substring(0, MaxLineLength) +FieldSeparator;  
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
                return  FieldNum5 + skuNum+FieldSeparator;
                    }
                else {
                    return  FieldNum5 + skuNum.substring(0, 4)+ "-" + skuNum.substring(4, skuNum.length) +FieldSeparator; 
                } 
        
            }
    static AddLine(line) {
        data += line + NewLine;
    }

 
    static BeginLabel() {
        return `
        ${StartOfText}`       
    }

    static EndLabel() {     
        return `   
${EndOfText}
 `;
   
}

    static GetRegularFormat(text) {
        return `${StartOfText}${text}${CarriageReturn}${EndOfText}`;
    }
}

export default UpcLabelZebra;