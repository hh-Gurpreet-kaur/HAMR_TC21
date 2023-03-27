import Scanning from '../misc/scanning'
import Bluetooth from '../printing/bluetooth'
import PrinterConfig from './printerConfig'
import { translate } from '../../translations/langHelpers'
import sqldb from '../misc/database';

// Control Character Codes
//  Control Name                 Acronym      
const StartOfText                = "^XA";      
const EndOfText                  = "^XZ";       
const PrintOrientation            = "^POI";    
const FormFeed                   = "^XFR:SAMPLE.GRF";       
const FieldNum1            = "^FN1^FD";   
const FieldNum2             = "^FN2^FD";       
const FieldNum3              = "^FN3^FD";      
const FieldNum4             = "^FN4^FD"; 
const FieldNum5            = "^FN5^FD";        
const FieldNum6             = "^FN6^FD";       
const FieldNum7             = "^FN7^FD";
const FieldNum8            = "^FN8^FD";   
const FieldNum9           = "^FN9^FD";   
const FieldSeparator       = "^FS";       
const font              = "^CF0,30";  

const MaxLineLength = 18;
const MaxnumLength = 7;
const NewLine = '\n';

class ShelfLabelZebra {


    static parseResults(results) {
        let item = results.item(0);

        let info = {};
        let price = item.RetailPrice > 0 ? item.RetailPrice : item.HomeRetailPrice;
        let override = "";
        if ((item.RetailPrice > 0) && (item.RetailPrice != item.HomeRetailPrice) && (item.SkuNum.length >= 7)) {
            override = item.RetailPrice > item.HomeRetailPrice ? "&+" : "&-";
        }
        let hhUpc = "";
        if ( (item.SkuNum.length >= 7)) {
            hhUpc = Scanning.getHHUpc(item.SkuNum);
        }
        else{
            hhUpc = item.UpcCode 
        }
        let upc = item.UpcCode ? item.UpcCode.toString().slice(-6, -1) : '';

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
         // Description
         let nonHomeUpc = item.upc;
         let hhUpc = '';
         if(item.skuNum.length>=MaxnumLength){
             hhUpc = Scanning.getHHUpc(item.skuNum);
         }
         else{hhUpc = item.skuNum;}
         
       //  let desc = this.SplitDescription(item.description)
        this.AddLine(this.SplitDescriptionn(item.description,
            item.mfgNum,item.retailPrice,item.retailUnit,item.skuNum,
        hhUpc,nonHomeUpc.substr(nonHomeUpc.length - 5, 5),item.override));
        // Trailer
       this.AddLine(this.EndLabel()); 
   
        return data;
    }
    static SplitDescriptionn(desc,mfgnum,price,unit,sku,upcbarcode,split,overide) {
   
            return  StartOfText+PrintOrientation+FormFeed+ this.SplitDescription(desc)+
            FieldNum3 +mfgnum+FieldSeparator+NewLine  +
            FieldNum4  +price+FieldSeparator+ NewLine +
            FieldNum5 +unit+FieldSeparator+   NewLine + this.SplitSkuNum(sku)+NewLine + 
            FieldNum7 + upcbarcode+FieldSeparator+ NewLine +
            FieldNum8 + split+FieldSeparator+ NewLine + 
            FieldNum9 + overide+FieldSeparator+ 
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
             return  FieldNum2 + desc.substring(splitPos).trim()+FieldSeparator + NewLine + 
             FieldNum1  + desc.substring(0, splitPos).trim() +FieldSeparator; 
        } else {
           // return desc.substring(MaxLineLength) + desc.substring(0, MaxLineLength)
            return FieldNum2  + desc.substring(MaxLineLength) +FieldSeparator+
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
            return  FieldNum6 + skuNum+FieldSeparator;
                }
            else {
                return  FieldNum6 + skuNum.substring(0, 4)+ "-" + skuNum.substring(4, skuNum.length) +FieldSeparator; 
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
 
}

export default ShelfLabelZebra;