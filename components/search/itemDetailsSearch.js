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

import sqldb from '../misc/database'
import color from '../../styles/colors'
import Settings from '../settings/settings'
import KeyEvent from 'react-native-keyevent'

import Analytics from '../../analytics/ga'
const KEYCODE_ENTER = 66;
class ItemDetails extends React.Component  {

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
      promo:'',
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
      data: [],
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
      this.newScan(this.state.previousSku + this.currentScan)
      this.currentScan = ''
    } else if (keyEvent.pressedKey == '^') {
      this.currentScan = '^'
      global.shouldNavigate = false
    }
  }


  componentDidMount () {
   // Analytics.trackScreenView('Order')
    this.initDb()

    this.focusListener = this.props.navigation.addListener("didFocus",  e => {
      this.setItem()
      setTimeout(() => {
    
          this._screen.focus()
        
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
    let check =
    prev.navigation.getParam("query", "1") !=
    this.props.navigation.getParam("query", "2");
  if (check) {
    this.start();
  }
}

  componentWillUnmount () {
    KeyEvent.removeKeyUpListener();
    this.focusListener.remove()
    this.blurListener.remove()
  }
  // kickstarter function, takes query
  start = () => {
    let q = this.props.navigation.getParam("query", "");
    let str = this.props.navigation.getParam("data", []);
    this.setState({
      data: str,
    });
    if (q.length > 0 && str.length > 0) {
      this.getResults(q);
    }
  }; 
   getItem = (sku, searchQ) => {
    // get results and display
    sqldb.executeReader(searchQ).then((results) => {
      if (results.length == 0) {
        this.setState({
          previousSku: sku,
         bg: color.invalid_scan
        })
        this.clearItem()
      } else {
        // have valid result
        const x = results.item(0)

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
            promo: x.PromoRetail.toFixed(2),
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
            quantityCorrect: x.QtyCorrect == 1
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
    })
  }  

  findBySku = (sku) => {
    let searchQ = this.getSearchQuery()

    searchQ += `
	LEFT JOIN ItemSupplier ON ItemMaster.SkuNum = ItemSupplier.SkuNum
	LEFT JOIN [Order] ON ItemMaster.SkuNum = [Order].SkuNum
	WHERE ItemMaster.SkuNum = ${sku}
	`
 // this.getResults(searchQ);
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
  //  this.getResults(searchQ);
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
      promo: '',
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
  // UI HANDLERS
  next = () => {
    // get index + len
    let index = this.state.data.indexOf(this.state.itemNumber.toString());
    let len = this.state.data.length;

    // get new index
    let newIndex = (index + 1) % len;
    let newItem = this.state.data[newIndex];
    this.setState({
      itemNumber: newItem,
    });

    let newQuery = this.buildQuery(newItem);
    this.findBySku(newItem)
   // this.getResults(newQuery);

    // log
    this.log("next done");
  };

  prev = () => {
    // get index + len
    let index = this.state.data.indexOf(this.state.itemNumber.toString());
    let len = this.state.data.length;

    // get new index
    let newIndex = (index - 1) % len;
    // safety check
    if (newIndex < 0) {
      newIndex = 0;
    }
    let newItem = this.state.data[newIndex];
    this.setState({
      itemNumber: newItem,
    });

    // construct new query
    let q = this.props.navigation.getParam("query", "aye");
    let end = q.indexOf("WHERE ItemMaster.SkuNum = ");
    let newQuery = q.slice(0, end);
    newQuery += `WHERE ItemMaster.SkuNum = ${newItem}`;

    // let loose
    //this.getResults(newQuery);
    this.findBySku(newItem);

    // log
    this.log("prev done");
  };

  buildQuery = (newItem) => {
    let q = this.props.navigation.getParam("query", "aye");
    let end = q.indexOf("WHERE ItemMaster.SkuNum = ");
    let newQuery = q.slice(0, end);
    newQuery += `WHERE ItemMaster.SkuNum = ${newItem}`;

    return newQuery;
  };
  // back button handler
  toResults = () => {
    this.props.navigation.goBack();
  };

// gets results, sends to parser
getResults = (q) => {
  sqldb.executeReader(q).then((results) => {
    if (results.length == 0) {
      this.setState({
        previousSku: sku,
        loading: false,
       bg: color.invalid_scan
      })
      this.clearItem()
      this.log("no results from " + q);
    } else {
      this.parseResults(results);
    }
  });
};

// parses results
parseResults = (results) => {
  let item = results.item(0);

  // calculate
  // cost
  let cost = item.RetailPrice > 0 ? item.RetailPrice : item.HomeRetailPrice;
  // gross margin
  let gm = 0;

  if (global.isThirdParty) {
    gm = ((cost - item.CurrAvgCost) / cost) * 100;
  } else {
    gm = ((cost - item.AcctCost) / cost) * 100;
  }

  // min max
  let mm = `${item.Min} / ${item.Max}`;
  // velocity
  let vel =
    item[`ifnull(ItemMaster.Velocity,'///')`] +
    item[`ifnull(ItemMaster.HomeVelocity,'')`];

  let accPrice = item.AcctCost.toFixed(2);
  //this.getImage(item.itemNumber.toString())
  
  this.getImage(item.SkuNum);

  // update in screen
  this.setState({
    description: item.Description,
    mfgNum: item.MfgNum,
    // toFixed to display prices ending in 0
    price: cost.toFixed(2),
    retailPrice: item.RetailPrice,
    homeRetailPrice: item.HomeRetailPrice,
    uom: item.RetailUnit,
    itemNumber: item.SkuNum,
    boh: item.WarehouseBOH,
    section: item.RetailLocation || "-",
    status: "",
    salesCode: item.SalesCode,
    shipCode: item.HHShipCode,
    qHand: item.StoreBOH,
    qOrder: item.OnOrderQty,
    clist: item.Clist,
    grossMargin: gm.toFixed(2),
    accountingCost: accPrice,
    unitCost: item.CurrAvgCost.toFixed(2),
    minMax: mm,
    velocityCode: vel,
    promo: item.PromoRetail.toFixed(2),
    shelfPack: item.ShelfPackQty,
    purchases: item.YrPurchaseQty,
    sales: item.YrSalesQty,
    status: item.StoreItemStatus,
    homeSource: item.HomeSource,
    subSkuNum: item.SubSkuNum,
    item: item,
    validItem: true,
    loading: false,
    quantityCorrect: item.QtyCorrect == 1 ? true : false,
  });

  Analytics.logViewItem(item.SkuNum, item.Description);
  if (Settings.autoPrint) {
    this.onPrint()
  }
  
};

renderLoading() {
  if (this.state.loading) {
    return (
      <View style={style.loading} pointerEvents="none">
        <ActivityIndicator size="large" />
      </View>
    );
  }
}
 // gateway function to order
 toOrder = () => {
  console.log("PRESS ORDER");
  this.props.navigation.navigate("OrderScreen", {
    state: this.state,
  });
};

renderOrderBtn() {
  if (global.securityLevel >= 4) {
    return (
      <AwesomeButton
      backgroundColor={color.light_green}
      backgroundDarker={color.light_green_darker}
      textSize={22}
      width={140}
      height={43}
      textColor={'white'}
      borderColor={color.light_green_darker}
      onPress={this.toOrder}
    >
      <Text style={orderStyles.orderBtnText}>
        {translate('order_btn')}
      </Text>
    </AwesomeButton>
    
    );
  } else {
    return <View style={{ width: "49%" }} />;
  }
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

 

  // Utility Functions

  log = (style) => {
    const debug = false
    if (debug) {
      console.log(style)
    }
  }

  // UI Handlers + Routers

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
       // quantity: (Number(this.state.quantity) + 1).toString(),
        scan
      })
      if (Settings.autoPrint) {
        this.onPrint()
      }
    } else {
     

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

  newScan = async (scan) => {
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
    setTimeout(this.togglePrint, 1000)
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

  /*   if (this.state.validItem) {
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
                {this.renderActive()}
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
    } */
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
      {/*   <View style={{ height: 374, width: '100%' }}> */}
          <ScrollView
            style={orderStyles.container}
            keyboardShouldPersistTaps={'handled'}
          >
             {this.renderTop()}  
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
                {this.renderActive()}
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
         
        <View style={style.status}>
              
              <Text style={style.title}>{this.state.itemNumber}</Text>
              <Text style={style.title}>
                {this.state.uom} / ${this.state.price}
              </Text>

            </View>
            <View style={orderStyles.status}>
        
              <TextInput
                ref={(screen) => this._screen = screen}
                placeholder={translate('scan_or_enter')}
                placeholderTextColor="red"
                keyboardType="numeric"
                value={this.state.scan}
                style={[
                  orderStyles.itemInput,
                  { backgroundColor: this.state.bg }
                ]}
                onChangeText={this.newScan}
                showSoftInputOnFocus={Settings.showNumpad}
              />
            </View>
          
          {/*   <View style={orderStyles.twoColumn}>
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
                 {!global.isThirdParty && (
              <DualRowDisplay
                title={translate("boh") + ":"}
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
            </View> */}
 <View style={style.stats}>
            {!global.isThirdParty && (
              <DualRowDisplay
                title={translate("boh") + ":"}
                value={this.state.boh}
                valueStyle={{ color: onOrderColor }}
              />
            )}

            <DualRowDisplay
              title={translate("shelf_pack") + ":"}
              value={this.state.shelfPack}
            />
            <DualRowDisplay
              title={translate("velocity_code") + ":"}
              value={this.state.velocityCode}
            />
            {global.isThirdParty && (
              <DualRowDisplay
                title={translate("min_max") + ":"}
                value={this.state.minMax}
              />
            )}
          {/*   // to show if item is on promo*/}
          <DualRowDisplay
              title={translate("promo") + ":"}
              value={this.state.promo}
              valueStyle={{ color: onOrderColor }}
            /> 
            {global.isThirdParty && (
              <View>
                <DualRowDisplay
                  title={translate("qty_on_order") + ":"}
                  value={this.state.qOrder}
                  valueStyle={{ color: onOrderColor }}
                />
                <DualRowDisplay
                  title={translate("qty_on_hand") + ":"}
                  value={this.state.qHand}
                  valueStyle={{ color: onHandColor }}
                />
              </View>
            )}

            {global.canSeeCost && (
              <View>
                <DualRowDisplay
                  title={translate("gross_margin") + ":"}
                  value={this.state.grossMargin}
                />
                <DualRowDisplay
                  title={translate("accounting_cost") + ":"}
                  value={this.state.accountingCost}
                />
              </View>
            )}

            {global.isThirdParty && global.canSeeCost && (
              <DualRowDisplay
                title={translate("unit_cost") + ":"}
                value={this.state.unitCost}
              />
            )}

            {/* {global.canSeeCost && (
              <DualRowDisplay
               title={translate("twelve_month_sales") + ":"}
                value={this.state.sales}
              />
            )}  */}

            {global.canSeeCost && (
              <DualRowDisplay
                title={translate("clist") + ":"}
                value={this.state.clist}
              />
            )}

            {global.canSeeCost && (
              <DualRowDisplay
                title={translate("twelve_month_purch") + ":"}
                value={this.state.purchases}
              />
            )}

            {global.canSeeCost && (
              <DualRowDisplay
                title={translate("sc") + ":"}
                value={this.state.salesCode}
              />
            )}
          </View>
            <View style={orderStyles.twoColumn}>
            {this.renderOrderBtn()}
           
              <AwesomeButton
            backgroundColor={color.pink}
            backgroundDarker={color.pink_darker}
            textSize={22}
            width={140}
            height={43}
            textColor={'white'}
            borderColor={color.pink_darker}
            onPress={this.onPrint}
          >
            <Icon name={'printer-wireless'} size={25} color="white" />
            <Text style={{ fontSize: 19, color: 'white', fontWeight: 'bold' }}>
              {translate('print_btn')}
            </Text>
          </AwesomeButton>
            </View>
          
          </ScrollView>
       {/*  </View> */}
        <View style={[style.orderPrintPanel]}>
     
        <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(color.btn_selected)}
            onPress={this.prev}
          >
            <View style={style.btn}>
              <Text style={style.btnText}> {translate("previous_btn")} </Text>
            </View>
          </TouchableNativeFeedback>

          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(color.btn_selected)}
            onPress={this.next}
          >
            <View style={style.btn}>
              <Text style={style.btnText}> {translate("next_btn")} </Text>
            </View>
          </TouchableNativeFeedback>

          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(color.btn_selected)}
            onPress={this.toResults}
          >
            <View style={style.btn}>
              <Text style={style.btnText}> {translate("back_btn")} </Text>
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
        {this.renderLoading()}

<TextInput 
        ref={(screen) => this._screen = screen}
        style={style.screenfocus}
        value={this.state.scanText}
        showSoftInputOnFocus={false} 
        onChangeText={this.newScan}
        caretHidden={true} 
        />
      </View>
    )
  }
}
const style = StyleSheet.create({
  container: {
    width: "100%",
  },
  title: {
    fontSize: 16,
    color: "black",
  },
  // main image
  imgBox: {
    // marginBottom: 10
    alignItems: "center",
    justifyContent: "center",
    height: 95,
    width: "75%",
    marginTop: 5,
    marginBottom: 5,
  },
  img: {
    resizeMode: "contain",
    width: 95,
    height: 95,
    marginTop: 5,
  },
  img_small: {
    resizeMode: "contain",
    width: 20,
    height: 20,
    marginTop: 5,
  },
  box: {
    borderWidth: 1,
    borderColor: "black",
    margin: 2,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: 'red'
  },
  status: {
    flexDirection: "row",
    margin: 3,
    // backgroundColor: 'red',
    justifyContent: "space-between",
    marginLeft: 30,
    marginRight: 30,
  },

  active: {
    backgroundColor: color.active,
    padding: 1,
    margin: 2,
  },
  inactive: {
    backgroundColor: color.inactive,
    padding: 1,
    margin: 2,
  },
  panel: {
    flexDirection: "row",
  },
  // Button Panel
  orderPrintPanel: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: 2,
    //marginRight: 1,
    //marginLeft: 1
  },
  // statistics container
  stats: {
    marginTop: 10,
  },
  btn: {
    padding: 5,
    alignItems: "center",
    borderColor: "black",
    borderWidth: 1,
    backgroundColor: "white",
    justifyContent: "center",
    backgroundColor: color.btn_unselected,
    height: 35,
    borderRadius: 5,
    width: "33%",
  },
  btnHalf: {
    padding: 5,
    //flex: 1,
    alignItems: "center",
    borderColor: "black",
    borderWidth: 1,
    backgroundColor: "white",
    justifyContent: "center",
    backgroundColor: color.btn_unselected,
    height: 35,
    borderRadius: 5,
    width: "49%",
  },
  btnText: {
    fontSize: 15,
    color: "black",
    textAlign: "center",
  },
  screenfocus: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
  },
  loading: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});


// add header + export
export default addHeader(ItemDetails, "item_detail");

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
