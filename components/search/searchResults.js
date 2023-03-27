import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  FlatList,
  TouchableNativeFeedback,
  Alert
} from 'react-native'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Sort from '../misc/sort'

import { MaterialIndicator } from 'react-native-indicators'

import addHeader from '../../hoc/addHeader'
import Modal from 'react-native-modal'
import Table from '../~handMade/threeTable'
import modalStyles from '../../styles/modalStyles'
import Settings from '../settings/settings'
import Label from '../printing/labels'
import orderStyles from '../../styles/orderStyles'

import { translate } from '../../translations/langHelpers'
import sqldb from '../misc/database'
import color from '../../styles/colors'

class SearchResults extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
            tableHead: [
                    translate("item_no"),
                    translate("boh"),
                    translate("description")
            ],
            tableData: [],
            sortType: 'sku',
            sortDirection: 'asc',
            isModalVisible: false,
            modalText: "",
            itemNumber: null
    }
}


log = (s) => {
    let debug = false
    if (debug) {
            console.log(s)
    }
}

// main starter function, takes query
start = (q) => {
    this.getResults(q);
}

sortResults = (header) => {
    let data = this.state.tableData.slice(0);
    let type = 'sku';
    let direction = 'asc';

    if (header == 1) {
            if (this.state.sortType == 'sku' && this.state.sortDirection == 'asc') {
                    data.sort((a, b) => {return Sort.compareSkuDesc(a, b)});
                    direction = 'desc';
            } else {
                    data.sort((a, b) => {return Sort.compareSkuAsc(a, b)});
                    direction = 'asc';
            }
    } else if (header == 2) {
            if (this.state.sortType == 'boh' && this.state.sortDirection == 'desc') {
                    data.sort((a, b) => {return Sort.compareBohAsc(a, b)});
                    type = 'boh';
                    direction = 'asc';
            } else {
                    data.sort((a, b) => {return Sort.compareBohDesc(a, b)});
                    type = 'boh';
                    direction = 'desc';
            }
    } else if (header == 3) {
            if (this.state.sortType == 'description' && this.state.sortDirection == 'asc') {
                    data.sort((a, b) => {return Sort.compareDescriptionDesc(a, b)});
                    type = 'description';
                    direction = 'desc';
            } else {
                    data.sort((a, b) => {return Sort.compareDescriptionAsc(a, b)});
                    type = 'description';
                    direction = 'asc';
            }
    }

    this.setState({
            tableData: data,
            sortType: type,
            sortDirection: direction
    });
}

// gets results, parses them 
// and updates states to show in results
parseResults = (results) => {
    let len = results.length
    let data = []

    this.state.itemNumber = null;

    for (var i=0; i<len; ++i) {
            let x = results.item(i);
            let boh = 0;
            if (global.isThirdParty) {
                    boh = x.StoreBOH;
            } else {
                    boh = x.WarehouseBOH;
            }
            data.push({
                    key: x.SkuNum.toString(),
                    boh: boh,
                    descr: x.Description,
                    back: i % 2 == 0 ? color.grey : 'white'
            })

            if (i == 0 && len >= 1) {
                    this.state.itemNumber = x.SkuNum.toString();
            } 
    }

    

    if (Settings.autoPrint && len == 1) {
            this.onPrint(data[0].key);
    }

    global.loading = false;
    this.setState({
            tableData : data
    })
}

// takes query, recieves data
// sends to parser
getResults = (q) => {
    this.setState({
            tableData: []
    })
    sqldb.executeReader(q).then((results) => {
            let len = results.length

            if (len == 0) {
                    console.log('no results returned from ' + q)
                    global.loading = false;
                    this.state.itemNumber = null;
                    // display notification
                    Alert.alert(
                            'Alert', 
                            translate('no_results_found'),
                            [{ text: "OK", onPress: () => this.props.navigation.goBack() }]
                    )
            } else {
                    this.parseResults(results)
            }

    })
}


// item click handler
itemPress = (sku) => {
    // Integrated vs Standalone
    let searchQ = `SELECT ItemMaster.SkuNum,
    ItemMaster.Description,
    ItemMaster.MfgNum,
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

    let str = "ItemMaster.PromoRetail" +
    ",ItemMaster.HomeRetailUnit" +
    ",ItemMaster.FormatFlag" +
    ",ItemMaster.OnOrderQty" +
    ",ItemMaster.EditFactor" +
    ",ItemMaster.BuyConv" +
    ",ItemMaster.BuyUnit" +
    ",ItemMaster.YrSalesQty" +
    ",ItemMaster.YrPurchaseQty" +
    ",ItemMaster.SubSkuNum" +
    ",ItemMaster.HHShipCode" +
    ",ifnull(ItemMaster.StoreItemStatus,0) as StoreItemStatus" +
    ",ifnull(ItemMaster.MfgNum,'')" +
    ",ifnull(ItemMaster.HomeVelocity,'')" +
    ",ifnull(ItemMaster.Velocity,'///')" +
    ",ifnull(ItemMaster.RetailLocation,'') as RetailLocation" +
    ",ifnull(ItemMaster.NonStockFlag,'')" +
    ",ifnull(ItemSupplier.SalesCode,0) as SalesCode" +
    ",ifnull(ItemSupplier.ShelfPackQty,0) as ShelfPackQty" +
    ",ifnull(ItemSupplier.AcctCost,0) as AcctCost" +
    ",ifnull([Order].QtyCorrect,0) as QtyCorrect" +
    ",ItemSupplier.Clist" +
    " FROM ItemMaster" 
searchQ += str

searchQ += `
LEFT JOIN ItemSupplier ON ItemMaster.SkuNum = ItemSupplier.SkuNum
    LEFT JOIN [Order] ON ItemMaster.SkuNum = [Order].SkuNum
WHERE  ItemMaster.SkuNum = ${sku}

`
//OR ItemMaster.SkuNum LIKE '${sku}%'
/* searchQ +=  `UNION
LEFT JOIN ItemSupplier ON ItemMaster.SkuNum = ItemSupplier.SkuNum
    LEFT JOIN [Order] ON ItemMaster.SkuNum = [Order].SkuNum
WHERE  ItemMaster.SkuNum  LIKE '${sku}%'AND NOT EXISTS (LEFT JOIN ItemSupplier ON ItemMaster.SkuNum = ItemSupplier.SkuNum
  LEFT JOIN [Order] ON ItemMaster.SkuNum = [Order].SkuNum
WHERE  ItemMaster.SkuNum = ${sku})
    ` */

this.props.navigation.navigate('ItemDetails', {
    query: searchQ,
    data: this.getSearchArray()
})
}

// returns sku Array
getSearchArray = () => {
    return this.state.tableData.map((x) => x.key)
}

componentDidMount() {
    // get query and type of search 
    let q = this.props.navigation.getParam('query', '')

    // init db
    if (q.length > 0) {
            this.start(q)
    }

}


componentDidUpdate(prevProps) {
    let q = this.props.navigation.getParam('query', '');
    let check = prevProps.navigation.getParam('query', '') != this.props.navigation.getParam('query', '')
    if (check) {
            this.start(q);
    }
}

onPrint = async (itemNumber) => {

    let modalText = "";
    let printSuccess = true;

    this.state.modalText = translate('connecting_printer');
    this.toggleModal();

   /*  if (Settings.labelType == "shelf") {
            printSuccess = await Label.PrintLabel("shelf", itemNumber, Settings.printerAddress);
            modalText = "shelf";
    } else {
            printSuccess = await Label.PrintLabel("upc", itemNumber, Settings.printerAddress);
            modalText = "UPC";
    } */
    if (Settings.labelType == "shelf" && Settings.printType == "pb32") {
      printSuccess = await Label.PrintLabel(
        "shelf",
        "pb32",
        itemNumber,
        Settings.printerAddress
      );
      modalText = "shelf";
    } 
    else if (Settings.labelType == "upc" && Settings.printType == "pb32"){
      printSuccess = await Label.PrintLabel(
        "upc",
        "pb32",
        itemNumber,
        Settings.printerAddress
      );
      modalText = "UPC";
    } 
    else if (Settings.labelType == "shelf" && Settings.printType == "zebra") {
      printSuccess = await Label.PrintLabel(
        "shelf",
        "zebra",
        itemNumber,
        Settings.printerAddress
      );
      modalText = "shelf";
    } 
    else if (Settings.labelType == "upc" && Settings.printType == "zebra")  {
      printSuccess = await Label.PrintLabel(
        "upc",
        "zebra",
        itemNumber,
        Settings.printerAddress
      );
      modalText = "UPC";
    }
    if (printSuccess === true) {
            this.setState({
                    modalText: translate('printing_label', {labelType: modalText, itemNumber: itemNumber})
            })
            this.timedModal();
    } else {
            alert(printSuccess);
            this.toggleModal();
    }
    
}

toggleModal = () => {
    this.setState({ 
            isModalVisible: !this.state.isModalVisible,
     });
}

timedModal = () => {
    setTimeout(this.toggleModal, 4000)
}


  render () {
    const numResults = this.state.tableData.length

    return (
      <View style={style.container}>
        <ScrollView stickyHeaderIndices={[1]}>
          <View style={style.head}>
            <View style={style.icon}>
              <Icon name={'database-search'} size={35} color={'black'} />
            </View>
            <View style={style.resultsBox}>
              <Text style={style.resultsText}>
                {' '}
                {numResults} {translate('results')}{' '}
              </Text>
              <LoadingIndicator count={this.state.tableData.length} />
            </View>
           {//Add back button to search screen to allow manual input
           /*  <View style={style.left}>
              <TouchableNativeFeedback
                background={TouchableNativeFeedback.Ripple(color.btn_selected)}
                onPress={this.toSearch}>
                <View
                  style={{
                    width: '100%',
                    alignSelf: 'center',
                    paddingHorizontal: 10
                  }}>
                  <Icon name={'magnify'} size={35} color={'black'} />
                  <Text style={style.resultsText}>{translate('search')} </Text>
                </View>
              </TouchableNativeFeedback>
            </View> */}
          </View>

          <View>
            <View style={{ backgroundColor: '#b4bbbf', flexDirection: 'row' }}>
              <TouchableNativeFeedback
                onPress={() => {
                  this.sortResults(1)
                }}
              >
                <View style={[rowStyle.cell, { width: 100 }]}>
                  <Text style={[rowStyle.cellText, { fontWeight: 'bold' }]}>
                    {' '}
                    {this.state.tableHead[0]}{' '}
                  </Text>
                </View>
              </TouchableNativeFeedback>

              <TouchableNativeFeedback
                onPress={() => {
                  this.sortResults(2)
                }}
              >
                <View
                  style={[rowStyle.cell, { width: 65, alignItems: 'center' }]}
                >
                  <Text style={[rowStyle.cellText, { fontWeight: 'bold' }]}>
                    {' '}
                    {this.state.tableHead[1]}{' '}
                  </Text>
                </View>
              </TouchableNativeFeedback>
              <TouchableNativeFeedback
                onPress={() => {
                  this.sortResults(3)
                }}
              >
                <View style={rowStyle.cell}>
                  <Text style={[rowStyle.cellText, { fontWeight: 'bold' }]}>
                    {' '}
                    {this.state.tableHead[2]}{' '}
                  </Text>
                </View>
              </TouchableNativeFeedback>
            </View>
          </View>
          <View style={{ minHeight: 342 }}>
            <Table
              tableHead={this.state.tableHead}
              tableData={this.state.tableData}
              navigation={this.props.navigation}
              onPressRow={this.itemPress}
              onPressHeader={this.sortResults}
            />
          </View>
        </ScrollView>

        <Modal
          isVisible={this.state.isModalVisible}
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
              <Text style={modalStyles.smallText}>{this.state.modalText}</Text>
            </View>
          </View>
        </Modal>
      </View>
    )
  }
}

// Loading Indicator Used
function LoadingIndicator (props) {
  const s = StyleSheet.create({
    container: {
      flex: 1,
      marginLeft: 70,
      // backgroundColor: 'grey',
      justifyContent: 'center',
      alignItems: 'center'
    }
  })

  const show = global.loading

  if (show) {
    return (
      <View style={s.container}>
        <MaterialIndicator color={color.heading} />
      </View>
    )
  } else {
    return null
  }
}

export default addHeader(SearchResults, 'search_results')

const style = StyleSheet.create({
  container: {
    height: '100%'
  },
  head: {
    backgroundColor: 'white',
    padding: 8,
    paddingBottom: 2,
    paddingTop: 2,
    margin: 1,
    alignItems: 'center',
    flexDirection: 'row'
  },
  results: {
    backgroundColor: 'white',
    margin: 2,
    padding: 2,
    flexDirection: 'row',
    // justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'black'
  },
  resultsText: {
    fontSize: 22
  },
  resultsBox: {
    // paddingBottom: 20,
    flexDirection: 'row',
    // backgroundColor: 'grey',
    flex: 1,
    marginLeft: 20
  },
  icon: {
    width: 35,
    height: 35
  },
  img: {
    flex: 1,
    resizeMode: 'contain',
    width: 70,
    height: 52
  },
  columnText: {
    fontSize: 20,
    fontWeight: 'bold'
  }
})

const rowStyle = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    width: '100%'
  },
  cell: {
    // borderWidth: 1,
    paddingTop: 2,
    paddingBottom: 2
  },
  cellText: {
    fontSize: 18,
    color: 'black'
  },
  action: {
    marginTop: 2
  },
  // Button Panel
  orderPrintPanel: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 2
    // marginRight: 1,
    // marginLeft: 1
  }
})
