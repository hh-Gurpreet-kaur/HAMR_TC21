import React from 'react'
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Image,
  TextInput,
  CheckBox,
  TouchableNativeFeedback,
  Keyboard,
  Alert,
  TouchableOpacity,
  TouchableHighlight
} from 'react-native'

import addHeader from '../../hoc/addHeader'
import AwesomeButton from 'react-native-really-awesome-button/src/themes/cartman'
import Images from '../misc/Images'
import { translate } from '../../translations/langHelpers'
import Scanning from '../misc/scanning'
import Modal from 'react-native-modal'
import modalStyles from '../../styles/modalStyles'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import EditFactor from '../misc/editFactor'
import Label from '../printing/labels'
import DeleteModal from '../~handMade/deleteModal'
import orderStyles from '../../styles/orderStyles'
import * as ItemStatus from '../misc/itemStatus'
import sqldb from '../misc/database'
import color from '../../styles/colors'
import Settings from '../settings/settings'
import KeyEvent from 'react-native-keyevent'

import Analytics from '../../analytics/ga'

class Order extends React.Component {
  currentScan = ''

  constructor (props) {
    super(props)
    this.state = {
      description: '',
      price: '',
      uom: 'UOM',
      section: '-',
      itemNumber: '',
      status: '',
      quantityCorrect: false,
      quantity: '',
      purchases: '',
      sales: '',
      cac: '',
      grossMargin: '',
      accountingCost: '',
      unitCost: '',
      shipCode: '',
      minMax: '',
      velocityCode: '',
      shelfPack: '',
      bg: 'white',
      base64Image: null,
      isModalVisible: false,
      itemOrderable: false,
      modalText: '',
      validItem: false,
      renderTop: false,
      previousSku: '',
      previousBarcode: '',
      item: null,
      scan: '',
      isImageExpanded: false,
      printingText: '',
      isPrintVisible: false,
      isDeleteModalVisible: false
    }
  }

  handleScan = (keyEvent) => {
    if (
      !isNaN(keyEvent.pressedKey) ||
      keyEvent.pressedKey == '|' ||
      keyEvent.pressedKey == '^'
    ) {
      if (keyEvent.keyCode != 66) {
        this.currentScan += keyEvent.pressedKey
      }
    }

    if (keyEvent.pressedKey == '|') {
      this.changeItemNumber(this.state.previousSku + this.currentScan)
      this.currentScan = ''
    } else if (keyEvent.pressedKey == '^') {
      this.currentScan = '^'
      global.shouldNavigate = false
    }
  }

  componentDidMount () {
    Analytics.trackScreenView('Order')
    this.initDb()

    this.focusListener = this.props.navigation.addListener('didFocus', (e) => {
      this.setItem()
      setTimeout(() => {
        if (!this._qty.isFocused()) {
          this._scan.focus()
        }
      }, 100)

      KeyEvent.onKeyUpListener((keyEvent) => {
        this.handleScan(keyEvent)
      })
    })

    this.blurListener = this.props.navigation.addListener('didBlur', (e) => {
      KeyEvent.removeKeyUpListener()
    })
  }

  // refresh entry point
  componentDidUpdate (prev) {
    const refresh =
      prev.navigation.getParam('state', '') !=
      this.props.navigation.getParam('state', '')
    if (refresh) {
      this.initDb()
    }
  }

  componentWillUnmount () {
    this.focusListener.remove()
    this.blurListener.remove()
  }

  getItem = (sku, searchQ) => {
    // get results and display
    sqldb.executeReader(searchQ).then((results) => {
      if (results.length == 0) {
        this.setState({
          previousSku: sku,
       //  bg: color.invalid_scan
        })
        this.clearItem()
      } else {
        // have valid result
        const x = results.item(0)
// commentout to order non home items
        /*  if (x.HomeSource != 'H') {
          this.timedOrderable()
          this.state.previousSku = ''
          this.state.scan = ''
          this.clearItem()
        } else {  */
          // pre calculate
          const price = x.RetailPrice > 0 ? x.RetailPrice : x.HomeRetailPrice
          let gm = 0

          if (global.isThirdParty) {
            gm = ((price - x.CurrAvgCost) / price) * 100
          } else {
            gm = ((price - x.AcctCost) / price) * 100
          }

          this.getImage(x.SkuNum)

          this.setState({
            description: x.Description,
            price: price.toFixed(2),
            bg: 'white',
            uom: x.RetailUnit,
            section: x.RetailLocation || '-',
            itemNumber: x.SkuNum.toString(),
            previousSku: x.SkuNum.toString(),
            scan: x.SkuNum.toString(),
            status: '',
            purchases: x.YrPurchaseQty,
            sales: x.YrSalesQty,
            cac: x.CurrAvgCost.toFixed(2),
            grossMargin: gm.toFixed(2),
            accountingCost: x.AcctCost.toFixed(2),
            unitCost: '',
            salesCode: x.SalesCode,
            shipCode: x.HHShipCode,
            minMax: x.Min + '/' + x.Max,
            velocityCode:
              x['ifnull(ItemMaster.Velocity,\'///\')'] +
              x['ifnull(ItemMaster.HomeVelocity,\'\')'],
            shelfPack: x.ShelfPackQty,
            status: x.StoreItemStatus,
            validItem: true,
            quantity: '1',
            item: x,
            homeSource: x.HomeSource,
            subSkuNum: x.SubSkuNum,
            qHand: x.StoreBOH,
            qOrder: x.OnOrderQty,
            boh: x.WarehouseBOH,
            quantityCorrect: x.QtyCorrect == 1  ? true : false,
          })

          if (Settings.autoPrint) {
            this.onPrint()
          }

          const orderCheck = `SELECT * FROM [Order] WHERE SkuNum = ${
            this.state.itemNumber
          }`
          sqldb.executeReader(orderCheck).then((results) => {
            if (results.length == 1) {
              // existing order, get quantity and update
              const oldQty = results.item(0).Qty + 1
              this.setState({
                quantity: oldQty.toString()
              })
            }
          })
        }
     // }
    })
  }

  findBySku = (sku) => {
    let searchQ = this.getSearchQuery()

    searchQ += `
	LEFT JOIN ItemSupplier ON ItemMaster.SkuNum = ItemSupplier.SkuNum
	LEFT JOIN [Order] ON ItemMaster.SkuNum = [Order].SkuNum
	WHERE ItemMaster.SkuNum = ${sku}
	`

    this.getItem(sku, searchQ)
  }

  findByUpc = (upc) => {
    let searchQ = this.getSearchQuery()
    searchQ += `
			LEFT JOIN Upc ON ItemMaster.SkuNum = Upc.SkuNum
	LEFT JOIN ItemSupplier ON ItemMaster.SkuNum = ItemSupplier.SkuNum
	LEFT JOIN [Order] ON ItemMaster.SkuNum = [Order].SkuNum
	WHERE Upc.UpcCode = ${upc}
	`
    this.getItem(upc, searchQ)
  }

  clearItem = () => {
    this.setState({
      description: '',
      price: '',
      uom: 'UOM',
      section: '-',
      status: '',
      purchases: '',
      sales: '',
      cac: '',
      shipCode: '',
      salesCode: '',
      grossMargin: '',
      accountingCost: '',
      unitCost: '',
      minMax: '',
      velocityCode: '',
      shelfPack: '',
      status: '',
      quantityCorrect: false,
      base64Image: null,
      quantity: '',
      validItem: false,
      item: null,
      boh: '',
      qHand: '',
      qOrder: ''
    })
  }

  getImage = async (sku) => {
    const image = await Images.getImage(sku)
    this.setState({
      base64Image: image
    })
  }

  setItem = () => {
    const sku = this.props.navigation.getParam('sku', '')
    this.props.navigation.setParams({ sku: '' })
    if (sku != '') {
      this.setState({
        itemNumber: sku,
        previousUpc: sku
      })
      this.findBySku(sku)
    }
  }

  // recieves state from item details page
  start = () => {
    const prev = this.props.navigation.getParam('state', 1)
    if (prev === 1) {
      return
    }

   /*   if (prev.homeSource != 'H') {
      this.timedOrderable()
      this.state.previousSku = ''
      this.state.scan = ''
      this.clearItem()
    } else {  */
      // console.log(prev);
      this.getImage(prev.itemNumber.toString())

      this.setState({
        description: prev.description,
        price: prev.price,
        uom: prev.uom,
        section: prev.section,
        itemNumber: prev.itemNumber.toString(),
        previousSku: prev.itemNumber.toString(),
        scan: prev.itemNumber.toString(),
        status: '',
        quantityCorrect: prev.quantityCorrect,
        quantity: '1',
        purchases: prev.purchases,
        sales: prev.sales,
        cac: prev.cac,
        salesCode: prev.salesCode,
        shipCode: prev.HHShipCode,
        grossMargin: prev.grossMargin,
        accountingCost: prev.accountingCost,
        unitCost: prev.unitCost,
        minMax: prev.minMax,
        velocityCode: prev.velocityCode,
        shelfPack: prev.shelfPack,
        status: prev.status,
        validItem: true,
        item: prev.item,
        homeSource: prev.homeSource,
        subSkuNum: prev.subSkuNum,
        qHand: prev.qHand,
        qOrder: prev.qOrder,
        boh: prev.boh
      })

      // check if order placed using skuNum
      const orderCheck = `SELECT * FROM [Order] WHERE SkuNum = '${
        prev.itemNumber
      }'`
      sqldb.executeReader(orderCheck).then((results) => {
        if (results.length == 1) {
          // existing order, get quantity and update
          const oldQty = results.item(0).Qty + 1
          this.setState({
            quantity: oldQty.toString()
          })
        }

        this._qty.focus()
      })
   // }
  }
/*   // actually writes in database
  addToOrder = () => {
    if (this.state.validItem) {
            let check = this.state.quantity.length > 0 && this.state.itemNumber.length > 0
            if (!check) {
                    return
            }
            let correct = this.state.quantityCorrect ? 1 : 0
            
            let quantity = EditFactor.AdjustQuantity(this.state.item, this.state.quantity);
            this.state.quantity = quantity.toString();

            let query = `SELECT Qty FROM [Order] WHERE SkuNum = '${this.state.itemNumber}'`;
            sqldb.executeReader(query).then((results) => {
                    if (results.length > 0) {
                            // update
                            let q = `UPDATE [ORDER]
                            SET Qty = ${quantity}, QtyCorrect = ${correct}
                            WHERE SkuNum = ${this.state.itemNumber}`
                            sqldb.executeQuery(q)
                            this.state.modalText = translate('order_updated', { itemNumber: this.state.itemNumber, quantity: quantity});
                            this.timedModal();
                    } else {
                            // fresh insert
                            let q = `INSERT INTO [Order](SkuNum,Qty,QtyCorrect)
                                    VALUES (${this.state.itemNumber},${quantity.toString()},${correct})`
                            sqldb.executeQuery(q)

                            this.state.modalText = translate('order_placed', { itemNumber: this.state.itemNumber, quantity: quantity});
                            this.timedModal();
                    }
            });

    }
    
} */
  // actually writes in database
  addToOrder = () => {
    if (this.state.validItem) {
      const check =
        this.state.quantity.length > 0 && this.state.itemNumber.length > 0
      if (!check) {
        return
      }
      const correct = this.state.quantityCorrect ? 1 : 0

      const quantity = EditFactor.AdjustQuantity(
        this.state.item,
        this.state.quantity
      )
      this.state.quantity = quantity.toString();
      const query = `SELECT Qty FROM [Order] WHERE SkuNum = '${
        this.state.itemNumber
      }'`
      sqldb.executeReader(query).then((results) => {
        if (results.length > 0) {
          // update
          const q = `UPDATE [ORDER]
									SET Qty = ${quantity}, QtyCorrect = ${correct}
									WHERE SkuNum = ${this.state.itemNumber}`
          sqldb.executeQuery(q)
            // increment QTY
          this.setState({
           quantity: (Number(this.state.quantity) + 1).toString()
          }) 
          
          this.state.modalText = translate('order_updated', {
            itemNumber: this.state.itemNumber,
            quantity: quantity
          })
         
            // existing order, get quantity and update
           
      // this.timedModal()
        } else {
          // fresh insert
          const q = `INSERT INTO [Order](SkuNum,Qty,QtyCorrect)
											VALUES (${this.state.itemNumber},${quantity.toString()},${correct})`
          sqldb.executeQuery(q)
         // increment QTY
          this.setState({
            quantity: (Number(this.state.quantity) + 1).toString()
          })

          this.state.modalText = translate('order_placed', {
            itemNumber: this.state.itemNumber,
            quantity: quantity
          })
          //banner
        // this.timedModal()
        }
      })
    }
    this.state.previousSku = ''
    this.state.scan = ''
    this.clearItem()
  } 
 // update order before going to review 
 UpdateOrder = () => {
        this.addToOrder()
        this.timedModal()
        this.state.scan = ''
    this.state.previousSku = ''
    this.clearItem()
    this.props.navigation.navigate('ReviewOrder')

      }
    

  // first function
  initDb = () => {
    this.start()
  }

  getSearchQuery = () => {
    let query = `SELECT ItemMaster.SkuNum,
			ItemMaster.Description,
			ItemMaster.CurrAvgCost,
			ItemSupplier.AllInCost,
			ItemSupplier.AcctCost,
			ItemMaster.RetailPrice,
			ItemMaster.HomeRetailPrice,
			ItemMaster.StoreBOH,
			ItemMaster.[Max],
			ItemMaster.[Min],
			ItemMaster.WarehouseBOH,
			ItemMaster.HomeSource,
			ItemMaster.RetailUnit,`

    const str =
      'ItemMaster.PromoRetail' +
      ',ItemMaster.HomeRetailUnit' +
      ',ItemMaster.FormatFlag' +
      ',ItemMaster.OnOrderQty' +
      ',ItemMaster.EditFactor' +
      ',ItemMaster.BuyConv' +
      ',ItemMaster.BuyUnit' +
      ',ItemMaster.YrSalesQty' +
      ',ItemMaster.YrPurchaseQty' +
      ',ItemMaster.SubSkuNum' +
      ',ItemMaster.HHShipCode' +
      ',ifnull(ItemMaster.StoreItemStatus,0) as StoreItemStatus' +
      ",ifnull(ItemMaster.MfgNum,'')" +
      ",ifnull(ItemMaster.HomeVelocity,'')" +
      ",ifnull(ItemMaster.Velocity,'///')" +
      ",ifnull(ItemMaster.RetailLocation,'-') as RetailLocation" +
      ",ifnull(ItemMaster.NonStockFlag,'')" +
      ',ifnull(ItemSupplier.SalesCode,0) as SalesCode' +
      ',ifnull(ItemSupplier.ShelfPackQty,0) as ShelfPackQty' +
      ',ifnull(ItemSupplier.AcctCost,0) as AcctCost' +
      ',ifnull([Order].QtyCorrect,0) as QtyCorrect' +
      ',ItemSupplier.Clist' +
      ' FROM ItemMaster'

    query += str
    return query
  }

  itemPress = () => {
    if (this.state.itemNumber != '') {
      let searchQ = this.getSearchQuery()

      searchQ += `
					LEFT JOIN ItemSupplier ON ItemMaster.SkuNum = ItemSupplier.SkuNum
					LEFT JOIN [Order] ON ItemMaster.SkuNum = [Order].SkuNum
					WHERE ItemMaster.SkuNum = ${this.state.itemNumber}
					`

      this.props.navigation.navigate('ItemDetails', {
        query: searchQ,
        data: [this.state.itemNumber]
      })
    }
  }

  // Utility Functions

  log = (style) => {
    const debug = false
    if (debug) {
      console.log(style)
    }
  }

  // UI Handlers + Routers
  changeCorrect = () => {
    this.setState({
      quantityCorrect: !this.state.quantityCorrect
    })
  }

  changeQuantity = (q) => {
    if (q.includes('|')) {
      const scan = q.split('^')
      this._scan.focus()
      Keyboard.dismiss()
      this.changeItemNumber(this.state.scan + '^' + scan[1])
    } else {
      if (!q.includes('^')) {
        this.setState({
          quantity: q.slice(0, 5)
        })
      }
    }
  }

  onImagePress = () => {
    if (this.state.base64Image != null) {
      this.setState({ isImageExpanded: !this.state.isImageExpanded })
    }
  }

  toReview = () => {
    this.props.navigation.navigate('OrderReview')
  }

  handleItem = async (scan, isScan) => {
    if (scan == this.state.previousSku || scan == this.state.previousBarcode) {
      this.setState({
        quantity: (Number(this.state.quantity) + 1).toString(),
        scan
      })
      if (Settings.autoPrint) {
        this.onPrint()
      }
    } else {
      if (isScan && this.state.previousSku != '') {
        this.addToOrder();   //  add to order list after scanning
      }

      if (scan.indexOf('^') != -1) {
        this.setState({
          scan
        })
        const tmpScn = scan.substring(1)
        if (tmpScn.length >= 11) {
          const upc = await Scanning.checkHomeUpc(tmpScn)
          if (upc.length <= 7) {
            this.findBySku(upc)
          } else {
            this.findByUpc(upc)
          }
        }
      } else {
        this.setState({
          scan,
          previousScan: ''
        })
        if (scan.length >= 11) {
          const upc = await Scanning.checkHomeUpc(scan)

          if (upc.length <= 7) {
            this.findBySku(upc)
          } else {
            this.findByUpc(upc)
          }
        } else {
          this.findBySku(scan)
        }
      }
    }
  }

  changeItemNumber = async (scan) => {
    let cleanedScan = ''
    const index = scan.indexOf('|')

    if (index != -1) {
      // pipe ('|') at end of string means barcode was scanned

      cleanedScan = scan.substring(0, index)
      cleanedScan = cleanedScan.slice(this.state.previousSku.length + 1)

      const upc = await Scanning.checkHomeUpc(cleanedScan)

      if (upc.length <= 7) {
        this.handleItem(upc, true)
      } else if (upc.length > 11) {
        if (this.state.previousScan == upc) {
          this.setState({
            quantity: (Number(this.state.quantity) + 1).toString(),
            scan: this.state.itemNumber
          })
          if (Settings.autoPrint) {
            this.onPrint()
          }
        } else {
          if (this.state.previousSku != '') {
           this.addToOrder();   //  add to order list after scanning
          }

          this.setState({
            scan: upc,
            previousScan: cleanedScan
          })
          this.findByUpc(upc)
        }
      }
    } else if (scan.length <= 7 || scan.length >= 11) {
      this.handleItem(scan, false)
    } else if (scan.length == 0) {
      this.setState({
        scan,
        previousSku: scan,
        previousBarcode: scan
      })
    } else {
      this.setState({
        scan,
        bg: 'white'
      })
    }
  }

  onPrint = async () => {
    let modalText = ''
    let printSuccess = true

    this.state.printingText = translate('connecting_printer')
    this.togglePrint()

    if (Settings.labelType == "shelf" && Settings.printType == "pb32") {
      printSuccess = await Label.PrintLabel(
        "shelf",
        "pb32",
        this.state.itemNumber,
        Settings.printerAddress
      );
      modalText = "shelf";
    } 
    else if (Settings.labelType == "upc" && Settings.printType == "pb32"){
      printSuccess = await Label.PrintLabel(
        "upc",
        "pb32",
        this.state.itemNumber,
        Settings.printerAddress
      );
      modalText = "UPC";
    } 
    else if (Settings.labelType == "shelf" && Settings.printType == "zebra") {
      printSuccess = await Label.PrintLabel(
        "shelf",
        "zebra",
        this.state.itemNumber,
        Settings.printerAddress
      );
      modalText = "shelf";
    } 
    else if (Settings.labelType == "upc" && Settings.printType == "zebra")  {
      printSuccess = await Label.PrintLabel(
        "upc",
        "zebra",
        this.state.itemNumber,
        Settings.printerAddress
      );
      modalText = "UPC";
    }

    if (printSuccess === true) {
      this.setState({
        printingText: translate('printing_label', {
          labelType: modalText,
          itemNumber: this.state.itemNumber
        })
      })
      this.timedPrint()
    } else {
      alert(printSuccess)
      this.togglePrint()
    }
  }

  toggleIsOrderable = () => {
    this.setState({
      itemOrderable: !this.state.itemOrderable
    })
  }

  timedOrderable = () => {
    if (!this.state.itemOrderable) {
      this.toggleIsOrderable()
      setTimeout(this.toggleIsOrderable, 2000)
    }
  }

  toggleModal = () => {
    this.setState({
      isModalVisible: !this.state.isModalVisible
    })
  }

  timedModal = () => {
    if (!this.state.isModalVisible) {
      this.toggleModal()
      //  order banner screen time
      setTimeout(this.toggleModal, 1000)
    }
  }

  togglePrint = () => {
    this.setState({
      isPrintVisible: !this.state.isPrintVisible
    })
  }

  timedPrint = () => {
    setTimeout(this.togglePrint, 4000)
  }

  onPressReview = () => {
    this.pressclear()
    //this.props.navigation.navigate('ReviewOrder');
     /* if (this.state.scan != '') {
    Alert.alert(
      'Alert', translate('order_line_prompt', {
        itemNumber: this.state.scan
      }),
     [
       {text: 'Yes', onPress: () => this.UpdateOrder()},
       {text: 'No', onPress: () => this.pressclear(), style: 'cancel'},
     ],
     { cancelable: false }
     //on clicking out side, Alert will not dismiss
   );
    }
   else{
    this.props.navigation.navigate('ReviewOrder')}  */
  }

  toggleDeleteModal = () => {
    this.setState({
      isDeleteModalVisible: !this.state.isDeleteModalVisible
    })
  }

  tryDelete = () => {
    if (this.state.scan != '') {
      this.toggleDeleteModal()
    }
  }

  pressDelete = () => {
    this.toggleDeleteModal()
    const query = `
		DELETE FROM [Order]
		WHERE OrderID IN 
		(
			SELECT OrderID from [Order] 
			WHERE SkuNum = ${this.state.itemNumber}
			ORDER BY OrderID DESC
			LIMIT 1
		)
		`
    sqldb.executeQuery(query)
    this.state.scan = ''
    this.state.previousSku = ''
    this.clearItem()
  }
  pressclear = () => {
    this.state.scan = ''
    this.state.previousSku = ''
    this.clearItem()
    this.props.navigation.navigate('ReviewOrder')
  }

  renderImage () {
    if (this.state.base64Image != null) {
      return (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'flex-end',
            width: '100%',
            height: '100%'
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              width: '90%',
              justifyContent: 'center'
            }}
          >
            <Image
              source={{
                uri: `data:image/jpg;base64,${this.state.base64Image}`
              }}
              style={orderStyles.img}
            />
          </View>
          <View style={{ width: '10%' }}>
            <Image
              source={require('../../assets/img/elastic_expansion.png')}
              style={orderStyles.img_small}
            />
          </View>
        </View>
      )
    } else {
      return (
        <Image
          source={require('../../assets/img/hh_grayscale.png')}
          style={orderStyles.img}
        />
      )
    }
  }

  renderActive () {
    if (this.state.status == '1') {
      return (
        <View style={orderStyles.active}>
          <Text style={[orderStyles.title, { color: 'black' }]}>
            {' '}
            {translate('active')}{' '}
          </Text>
        </View>
      )
    } else {
      return (
        <View style={orderStyles.inactive}>
          <Text style={[orderStyles.title, { color: 'black' }]}>
            {' '}
            {translate('inactive')}{' '}
          </Text>
        </View>
      )
    }
  }
  renderStatus () {
    if (this.state.status == ItemStatus.Active || this.state.shipCode == ItemStatus.Active) {
      return (
        <View style={orderStyles.active}>
          <Text style={[orderStyles.title, { color: 'black' }]}>
            {' '}
            {translate('Backordered')}{' '}
          </Text>
        </View>
      )
    } else  if (this.state.status == ItemStatus.TempUnavail || this.state.shipCode == ItemStatus.TempUnavail) {
      return (
        <View style={orderStyles.inactive}>
          <Text style={[orderStyles.title, { color: 'black' }]}>
            {' '}
            {translate('TempUnavail')}{' '}
          </Text>
        </View>
      )
    }else  if (this.state.status == ItemStatus.DiscByHome || this.state.shipCode == ItemStatus.DiscByHome) {
      return (
        <View style={orderStyles.inactive}>
          <Text style={[orderStyles.title, { color: 'black' }]}>
            {' '}
            {translate('discbyhome')}{' '}
          </Text>
        </View>
      )
    }
    else  if (this.state.status == ItemStatus.NotInThisWarehouse || this.state.shipCode == ItemStatus.NotInThisWarehouse) {
      return (
        <View style={orderStyles.inactive}>
          <Text style={[orderStyles.title, { color: 'black' }]}>
            {' '}
            {translate('NotInThisWarehouse')}{' '}
          </Text>
        </View>
      )
    }else  if (this.state.status == ItemStatus.SoldoutForSeason || this.state.shipCode == ItemStatus.SoldoutForSeason) {
      return (
        <View style={orderStyles.inactive}>
          <Text style={[orderStyles.title, { color: 'black' }]}>
            {' '}
            {translate('SoldoutForSeason')}{' '}
          </Text>
        </View>
      )
    }else  if (this.state.status == ItemStatus.DiscByDealer || this.state.shipCode == ItemStatus.DiscByVendor) {
      return (
        <View style={orderStyles.inactive}>
          <Text style={[orderStyles.title, { color: 'black' }]}>
            {' '}
            {translate('discbydealer')}{' '}
          </Text>
        </View>
      )
    }
     else  if (this.state.status == ItemStatus.Inactive) {
      return (
        <View style={orderStyles.inactive}>
          <Text style={[orderStyles.title, { color: 'black' }]}>
            {' '}
            {translate('inactive')}{' '}
          </Text>
        </View>
      )
    }
    else {
      return (
        <View style={orderStyles.inactive}>
          <Text style={[orderStyles.title, { color: 'black' }]}>
            {' '}
            {translate('inactive')}{' '}
          </Text>
        </View>
      )
    }
  }
  renderTop () {
    let descColor = 'black'
    if (this.state.homeSource == 'S') {
      descColor = 'green'
    }
    if (this.state.shipCode == 13 || this.state.shipCode == 15) {
      descColor = 'peru' // brown
    }
    if (this.state.subSkuNum != 0 && this.state.subSkuNum != '') {
      descColor = 'purple'
    }

    if (this.state.validItem) {
      return (
        <View style={{ width: '100%' }}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <TouchableOpacity
              style={orderStyles.imgBox}
              onPress={this.onImagePress}
            >
              {this.renderImage()}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <View style={orderStyles.center}>
                <Text style={orderStyles.title}> {translate('status')}: </Text>
              {/*   {this.renderActive()} */}
                {this.renderStatus()}
              </View>
              {global.isThirdParty && (
                <View style={orderStyles.center}>
                  <Text style={orderStyles.title}>
                    {' '}
                    {translate('section')}:{' '}
                  </Text>
                  <View style={orderStyles.box}>
                    <Text style={orderStyles.title}>
                      {' '}
                      {this.state.section}{' '}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={orderStyles.description}>
              {this.state.description}
            </Text>
          </View>
        </View>
      )
    }
  }

  render () {
    let onHandColor = 'black'
    if (this.state.qHand > 0) {
      onHandColor = 'green'
    } else if (this.state.qHand < 0) {
      onHandColor = 'red'
    }

    let onOrderColor = 'black'
    if (this.state.qOrder > 0) {
      onOrderColor = 'green'
    } else if (this.state.qOrder < 0) {
      onOrderColor = 'red'
    }

    let qtyText = translate('qty_caps')
    if (this.state.quantity.length > 4) {
      qtyText = qtyText.slice(1)
    }

    return (
      <View style={{ flex: 1, width: '100%' }}>
        <View style={{ height: 374, width: '100%' }}>
          <ScrollView
            style={orderStyles.container}
            keyboardShouldPersistTaps={'handled'}
          >
            {this.renderTop()}

            <View style={orderStyles.status}>
              <TextInput
                ref={(input) => (this._scan = input)}
                placeholder={translate('scan_or_enter')}
                placeholderTextColor="red"
                keyboardType="numeric"
                value={this.state.scan}
                style={[
                  orderStyles.itemInput,
                  { backgroundColor: this.state.bg }
                ]}
                onChangeText={this.changeItemNumber}
                showSoftInputOnFocus={Settings.showNumpad}
              />
            </View>
            <View style={orderStyles.row}>
              <View style={orderStyles.quantity}>
                <Text style={orderStyles.largeText}>{qtyText}:</Text>
                <TextInput
                  ref={(qty) => (this._qty = qty)}
                  textAlign={'center'}
                  textAlignVertical={'center'}
                  keyboardType={'numeric'}
                  placeholder={'0'}
                  selectTextOnFocus={true}
                  value={this.state.quantity}
                  onChangeText={this.changeQuantity}
                  style={[orderStyles.qtyInput]}
                  showSoftInputOnFocus={Settings.showNumpad}
                />
              </View>

              <Text style={orderStyles.title}>
                {this.state.uom} / ${this.state.price}
              </Text>

              <View style={orderStyles.correct}>
                <CheckBox
                  style={{ marginHorizontal: -5 }}
                  value={this.state.quantityCorrect}
                  onValueChange={() =>
                    this.setState({
                      quantityCorrect: !this.state.quantityCorrect
                    })
                  }
                />
                <Text style={{ fontSize: 13 }}>
                  {' '}
                  {translate('quantity_correct')}{' '}
                </Text>
              </View>
            </View>

            <View style={orderStyles.twoColumn}>
              <View style={orderStyles.largeColumn}>
                {global.isThirdParty && (
                  <DualRowDisplay
                    title={translate('min_max') + ':'}
                    value={this.state.minMax}
                  />
                )}
                {global.canSeeCost && (
                  <DualRowDisplay
                    title={translate('accounting_cost') + ':'}
                    value={this.state.accountingCost}
                  />
                )}

                <DualRowDisplay
                  title={translate('velocity_code') + ':'}
                  value={this.state.velocityCode}
                />

                {global.canSeeCost && (
                  <DualRowDisplay
                    title={translate('gross_margin') + ':'}
                    value={this.state.grossMargin}
                  />
                )}

                {global.isThirdParty && (
                  <DualRowDisplay
                    title={translate('twelve_month_purch') + ':'}
                    value={this.state.purchases}
                  />
                )}
              
              </View>

              <View style={orderStyles.smallColumn}>
                {global.isThirdParty && (
                  <DualRowDisplay
                    title={translate('qty_on_hand') + ':'}
                    value={this.state.qHand}
                    valueStyle={{ color: onHandColor }}
                  />
                )}
                {global.isThirdParty
                  ? (
                  <DualRowDisplay
                    title={translate('qty_on_order') + ':'}
                    value={this.state.qOrder}
                    valueStyle={{ color: onOrderColor }}
                  />
                    )
                  : (
                  <DualRowDisplay
                    title={translate('boh') + ':'}
                    value={this.state.boh}
                    valueStyle={{ color: onOrderColor }}
                  />
                    )}

                <DualRowDisplay
                  title={translate('sc') + ':'}
                  value={this.state.salesCode}
                />
                <DualRowDisplay
                  title={translate('shelf_pack') + ':'}
                  value={this.state.shelfPack}
                />
                  {global.isThirdParty && (
                  <DualRowDisplay
                    title={translate('twelve_month_sales') + ':'}
                    value={this.state.sales}
                  />
                )}
              </View>
            </View>

            <View style={orderStyles.twoColumn}>
              <AwesomeButton
                backgroundColor={color.light_green}
                backgroundDarker={color.light_green_darker}
                textSize={22}
                width={140}
                height={43}
                textColor={'white'}
                borderColor={color.light_green_darker}
                onPress={this.addToOrder}
              >
                <Text style={orderStyles.orderBtnText}>
                  {translate('order_btn')}
                </Text>
              </AwesomeButton>

              <AwesomeButton
                backgroundColor={color.pink}
                backgroundDarker={color.pink_darker}
                textSize={22}
                width={140}
                height={43}
                textColor={'white'}
                borderColor={color.pink_darker}
                onPress={this.tryDelete}
              >
                <Icon name={'delete'} size={25} color="white" />
                <Text
                  style={{ fontSize: 19, color: 'white', fontWeight: 'bold' }}
                >
                  {translate('delete_btn_caps')}
                </Text>
              </AwesomeButton>
            </View>
            <Text style={orderStyles.orderBtnText}>
              {this.state.previousSku}
            </Text>
            <DeleteModal
              onDeleteRow={this.pressDelete}
              prompt={translate('delete_line_prompt', {
                itemNumber: this.state.scan
              })}
              visible={this.state.isDeleteModalVisible}
              onHide={this.toggleDeleteModal}
            />
          </ScrollView>
        </View>
        <View style={orderStyles.orderPrintPanel}>
          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(color.btn_selected)}
            onPress={this.itemPress}
          >
            <View style={orderStyles.btn}>
              <Text style={orderStyles.btnText}> {translate('item_btn')} </Text>
            </View>
          </TouchableNativeFeedback>

          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(color.btn_selected)}
            onPress={this.onPressReview}
          >
            <View style={orderStyles.btn}>
              <Text style={orderStyles.btnText}>
                {' '}
                {translate('review_btn')}{' '}
              </Text>
            </View>
          </TouchableNativeFeedback>
        </View>
        <Modal
          isVisible={this.state.isModalVisible}
          hasBackdrop={false}
          coverScreen={false}
          animationIn="fadeIn"
          animationOut="fadeOut"
        >
          <View style={modalStyles.noDbModal}>
            <View style={modalStyles.icon}>
              <Icon name={'check-circle'} size={50} color={color.light_green} />
            </View>
            <View style={modalStyles.modalText}>
              <Text style={modalStyles.smallText}>{this.state.modalText}</Text>
            </View>
          </View>
        </Modal>
        <Modal
          isVisible={this.state.itemOrderable}
          hasBackdrop={false}
          coverScreen={false}
          animationIn="fadeIn"
          animationOut="fadeOut"
        >
          <View style={modalStyles.noDbModal}>
            <View style={modalStyles.icon}>
              <Icon name={'alert-circle'} size={50} color={color.modal_red} />
            </View>
            <View style={modalStyles.modalText}>
              <Text style={modalStyles.smallText}>
                {translate('not_orderable')}
              </Text>
            </View>
          </View>
        </Modal>
        <Modal
          style={modalStyles.expandedImage}
          isVisible={this.state.isImageExpanded}
          on
          onBackdropPress={this.onImagePress}
          coverScreen={true}
          animationIn="slideInDown"
          animationOut="slideOutUp"
        >
          <TouchableHighlight
            style={modalStyles.imgBox}
            underlayColor="white"
            onPress={this.onImagePress}
          >
            <Image
              source={{
                uri: `data:image/jpg;base64,${this.state.base64Image}`
              }}
              style={modalStyles.img}
            />
          </TouchableHighlight>
        </Modal>
        <Modal
          isVisible={this.state.isPrintVisible}
          hasBackdrop={false}
          coverScreen={false}
          animationIn="fadeIn"
          animationOut="fadeOut"
        >
          <View style={modalStyles.noDbModal}>
            <View style={modalStyles.icon}>
              <Icon
                name={'printer-wireless'}
                size={50}
                color={color.light_green}
              />
            </View>
            <View style={modalStyles.modalText}>
              <Text style={modalStyles.smallText}>
                {this.state.printingText}
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    )
  }
}

export default addHeader(Order, 'item_ordering')

export function DualRowDisplay (props) {
  const styleRow = StyleSheet.create({
    rows: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 1
      // backgroundColor: 'red'
    },
    textValue: {
      // marginRight: 40,
      backgroundColor: color.light_grey,
      paddingVertical: 2,
      paddingHorizontal: 1,
      width: '36%'
    },
    defaultText: {
      color: 'black',
      fontSize: 13
    }
  })

  if (props.valueStyle) {
    return (
      <View style={styleRow.rows}>
        <View style={styleRow.textTitle}>
          <Text style={styleRow.defaultText}>{props.title}</Text>
        </View>
        <View style={styleRow.textValue}>
          <Text
            style={[
              styleRow.defaultText,
              { textAlign: 'center' },
              props.valueStyle
            ]}
          >
            {props.value}
          </Text>
        </View>
      </View>
    )
  } else {
    return (
      <View style={styleRow.rows}>
        <View style={styleRow.textTitle}>
          <Text style={styleRow.defaultText}>{props.title}</Text>
        </View>
        <View style={styleRow.textValue}>
          <Text style={[styleRow.defaultText, { textAlign: 'center' }]}>
            {props.value}
          </Text>
        </View>
      </View>
    )
  }
}
