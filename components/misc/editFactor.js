

let EditFactor = {

    AdjustQuantity: function (item, quantity) {
        console.log(item);
        let adjustedQty = quantity;
        if (item) {
            let multiple = item.BuyConv * item.ShelfPackQty;

            // If we have a 0 multiple, we have missing data or bad data, so we can't adjust.
            if (item.EditFactor != 0 || multiple != 0) {
                switch (item.EditFactor) {
                    // Most common two scenarios up top

                    case 12:    // Always ship nearest shelf pack
                        if (quantity % multiple > 0) {
                            adjustedQty = Number(quantity) + Number((multiple - (quantity % multiple)));
                        }
                        break;

                    case 11:    // If > 1/2 shelf pack, ship nearest shelf pack.
                        if ((quantity % multiple) > multiple / 2.0) {
                            adjustedQty = Number(quantity) + Number(multiple - (quantity % multiple));
                        }
                        break;

                    case 1:     // If > 5, ship 1
                        if (quantity > 5) {
                            adjustedQty = 1.0;
                        }
                        break;

                    case 2:     // Ship 1 shelf pack
                        adjustedQty = multiple;
                        break;

                    case 3:     // If > 11, ship 1
                        if (quantity > 11) {
                            adjustedQty = 1.0;
                        }
                        break;

                    case 5:     // If > 23, ship 1
                        if (quantity > 23) {
                            adjustedQty = 1.0;
                        }
                        break;

                    case 7:     // If > 47, ship 1
                        if (quantity > 47) {
                            adjustedQty = 1.0;
                        }
                        break;

                    case 9:     // If > 99, ship 1
                        if (quantity > 99) {
                            adjustedQty = 1.0;
                        }
                        break;

                    case 21:     // If > 144, ship 1
                        if (quantity > 144) {
                            adjustedQty = 1.0;
                        }
                        break;

                    case 22:     // If > 199, ship 1
                        if (quantity > 199) {
                            adjustedQty = 1.0;
                        }
                        break;

                    case 23:     // If > 249, ship 1
                        if (quantity > 249) {
                            adjustedQty = 1.0;
                        }
                        break;

                    case 24:     // If > 499, ship 1
                        if (quantity > 499) {
                            adjustedQty = 1.0;
                        }
                        break;

                    case 25:     // If > 999, ship 1
                        if (quantity > 999) {
                            adjustedQty = 1.0;
                        }
                        break;
                }
            }
        }

        return adjustedQty;
    }
}



export default EditFactor;