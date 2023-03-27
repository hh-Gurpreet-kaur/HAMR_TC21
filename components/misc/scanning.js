const UpcPrefix = "4000"

let Scanning = {
    checkHomeUpc: function(upc) {
        if ((upc.length == 12) && (upc.slice(0, 4) == UpcPrefix)) {
            if (upc.charAt(11) == getCheckDigit(upc.slice(0, 11))) {
                return upc.slice(4,11);
            } else {
                return upc;
            }
        } else {
            return upc;
        }
    },
    checknonHomeUpc: function(upc) {
         if (upc.slice(0, 4) !== UpcPrefix) {
            if (upc.charAt(11) == getCheckDigit(upc.slice(0, 11))) {
                return upc.slice(4,11);
            } else {
                return upc;
            }
        } 
        
    },
    isHomeUpc: function(upc) {
        return (upc.slice(0,4) == "4000")
    },

    getHHUpc: function(sku) {
        let fsku = UpcPrefix + sku;
        return fsku + getCheckDigit(fsku);
    }
}

function getCheckDigit(upc) {
    let totalOdds = 0;
    let totalEvens = 0;

        if (upc.length < 11)
        {
            return ' ';
        }

        for (var i = 0; i < upc.length; i++)
        {
            if ((i % 2) == 0)
            {
                totalOdds += Number(upc[i]);
            }
            else
            {
                totalEvens += Number(upc[i]);
            }
        }
        totalOdds = totalOdds * 3;

        // The second mod 10 is to remove the possibility of getting 10 as the check digit (getting 10 means we return
        // 0, so by using mod 10 again, we save an if check).
        var checkDigit = (10 - ((totalEvens + totalOdds) % 10)) % 10;

        return checkDigit;
}

function log(s) {
    let debug = true
    if (debug) {
        console.log(s)
    }
}

export default Scanning;