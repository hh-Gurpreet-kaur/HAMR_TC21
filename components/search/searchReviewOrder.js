import React from 'react'
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableNativeFeedback,
  TextInput
} from 'react-native'

import addHeader from '../../hoc/addHeader'

import FourTable from '../~handMade/fourTable'
import { translate } from '../../translations/langHelpers'
import Label from '../printing/labels'
import Modal from 'react-native-modal'
import modalStyles from '../../styles/modalStyles'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import DeleteModal from '../~handMade/deleteModal'

import sqldb from '../misc/database'
import color from '../../styles/colors'
import Settings from '../settings/settings'

import Analytics from '../../analytics/ga'

class ReviewOrder extends React.Component {
  // state
  constructor (props) {
    super(props)
    this.state = {
      tableHead: [
        translate('item_no'),
        translate('qty'),
        translate('ext_cost'),
        translate('description')
      ],
      tableData: [],
      cost: '$0.00',
      lines: 0,
      retail: '$0.00',
      selected: -1,
      isModalVisible: false,
      isDeleteModalVisible: false,
      modalText: '',
      selected: null
    }

    this.deleteColor = color.delete_line
  }

  componentDidMount () {
    Analytics.trackScreenView('Review Order')
    this.start()
    this.focusListener = this.props.navigation.addListener(
      'didFocus',
      this.start
    )
  }

  componentWillUnmount () {
    this.focusListener.remove()
  }

  updateStatus = () => {
    let c = 0
    let r = 0
    const len = this.state.tableData.length

    for (let i = 0; i < len; ++i) {
      const x = this.state.tableData[i]

      c += x.aCost * x.item
      r += x.rCost * x.item
    }

    this.setState({
      cost: '$' + c.toFixed(2),
      lines: len,
      retail: '$' + r.toFixed(2)
    })
  }

  parseResults = (results) => {
    // retrieve all the rows
    const data = []
    const len = results.length
    for (let i = 0; i < len; ++i) {
      const x = results.item(i)
      let extCost = x.Qty * x.AcctCost
      extCost = extCost.toFixed(2)
      const atom = {
        key: x.SkuNum.toString(),
        boh: extCost,
        descr: x.Description,
        back: i % 2 == 0 ? color.grey : 'white',
        item: x.Qty,
        aCost: x.AcctCost,
        rCost: x.HomeRetailPrice,
        delete: x.OrderID,
        retailPrice: x.RetailPrice,
        uom: x.RetailUnit,
        mfgNum: x.MfgNum
      }
      data.push(atom)
    }

    // update all the rows to render
    this.setState({
      tableData: data
    })

    this.updateStatus()
  }

  // queries database, sends to parser if results returned
  getResults = () => {
    const q = `SELECT [Order].OrderID, [Order].SkuNum, [Order].Qty, ItemSupplier.AcctCost, 
		ItemMaster.HomeRetailPrice, ItemMaster.Description , ItemMaster.RetailPrice, ItemMaster.RetailUnit, ItemMaster.MfgNum
		FROM [Order] 
		LEFT JOIN ItemSupplier ON ItemSupplier.SkuNum = [Order].SkuNum
		LEFT JOIN ItemMaster ON ItemMaster.SkuNum = [Order].SkuNum `

    // clean command
    // let del = `DELETE FROM [Order]`

    sqldb.executeReader(q).then((results) => {
      if (results.length == 0) {
        console.log('order table empty?')
      } else {
        this.parseResults(results)
      }
    })
  }

  start = () => {
    this.getResults()
  }

  // select row, color selected
  // uncolor unselected
  selectRow = (data) => {
    const ans = []
    const len = this.state.tableData.length
    let selected = -1

    for (let i = 0; i < len; ++i) {
      const x = this.state.tableData[i]

      let back = i % 2 == 0 ? color.grey : 'white'

      if (x.key == data.upc) {
        back = this.deleteColor
        selected = i
      }

      ans.push({
        key: x.key,
        boh: x.boh,
        descr: x.descr,
        item: x.item,
        aCost: x.aCost,
        rCost: x.rCost,
        back,
        delete: x.delete,
        retailPrice: x.retailPrice,
        uom: x.uom,
        mfgNum: x.mfgNum
      })
    }

    this.setState({
      tableData: ans,
      selected
    })
  }

  tryDelete = () => {
    if (this.state.selected != null) {
      this.toggleDeleteModal()
    }
  }

  // delete row based on color
  deleteRow = () => {
    this.toggleDeleteModal()
    // traverse through tableData to find row to delete
    const len = this.state.tableData.length
    const ans = []
    let orderId = ''
    for (let i = 0; i < len; ++i) {
      const x = this.state.tableData[i]

      if (x.back == this.deleteColor) {
        orderId = x.delete
        this.log('found orderID to delete' + orderId)
      }

      if (x.back != this.deleteColor) {
        ans.push({
          key: x.key,
          boh: x.boh,
          descr: x.descr,
          back: i % 2 == 0 ? color.grey : 'white',
          item: x.item,
          aCost: x.aCost,
          rCost: x.rCost,
          delete: x.delete,
          retailPrice: x.retailPrice,
          uom: x.uom,
          mfgNum: x.mfgNum
        })
      }
    }

    // construct query
    const q = `
		DELETE FROM [Order]
		WHERE OrderID = ${orderId}
		`
    sqldb.executeQuery(q)

    // update view
    this.state.tableData = ans
    this.state.selected = null

    this.updateStatus()
  }

  onPrint = async () => {
    if (this.state.selected != null) {
      console.log('Printing...')
      const selectedItem = this.state.tableData[this.state.selected]
      let modalText = ''
      let printSuccess = false

      this.state.modalText = translate('connecting_printer')
      this.toggleModal()

    /*   if (Settings.labelType == 'shelf') {
        printSuccess = await Label.PrintLabel(
          'shelf',
          selectedItem.key,
          Settings.printerAddress
        )
        modalText = 'shelf'
      } else {
        printSuccess = await Label.PrintLabel(
          'upc',
          selectedItem.key,
          Settings.printerAddress
        )
        modalText = 'UPC'
      } */
      if (Settings.labelType == "shelf" && Settings.printType == "pb32") {
        printSuccess = await Label.PrintLabel(
          "shelf",
          "pb32",
          selectedItem.key,
          Settings.printerAddress
        );
        modalText = "shelf";
      } 
      else if (Settings.labelType == "upc" && Settings.printType == "pb32"){
        printSuccess = await Label.PrintLabel(
          "upc",
          "pb32",
          selectedItem.key,
          Settings.printerAddress
        );
        modalText = "UPC";
      } 
      else if (Settings.labelType == "shelf" && Settings.printType == "zebra") {
        printSuccess = await Label.PrintLabel(
          "shelf",
          "zebra",
          selectedItem.key,
          Settings.printerAddress
        );
        modalText = "shelf";
      } 
      else if (Settings.labelType == "upc" && Settings.printType == "zebra")  {
        printSuccess = await Label.PrintLabel(
          "upc",
          "zebra",
          selectedItem.key,
          Settings.printerAddress
        );
        modalText = "UPC";
      }
      if (printSuccess === true) {
        this.setState({
          modalText: translate('printing_label', {
            labelType: modalText,
            itemNumber: selectedItem.key
          })
        })
        this.timedModal()
      } else {
        alert(printSuccess)
        this.toggleModal()
      }
    }
  }

  // utility section
  log = (style) => {
    const debug = true
    if (debug) {
      console.log(style)
    }
  }

  // add item handler
  toOrder = () => {
    if (this.state.selected != null) {
      this.props.navigation.navigate('OrderScreen', {
        sku: this.state.tableData[this.state.selected].key
      })
    } else {
      this.props.navigation.goBack()
    }
  }

  // back handler
  toSearchResults = () => {
    this.props.navigation.navigate('SearchResults')
  }

  toggleModal = () => {
    this.setState({
      isModalVisible: !this.state.isModalVisible
    })
  }

  toggleDeleteModal = () => {
    this.setState({
      isDeleteModalVisible: !this.state.isDeleteModalVisible
    })
  }

  onBackdropPress = () => {
    this.toggleDeleteModal()
  }

  timedModal = () => {
    setTimeout(this.toggleModal, 4000)
  }

  renderCost () {
    if (global.canSeeCost) {
      return (
        <View style={style.stats}>
          <View style={S.box}>
            <View>
              <Text style={S.title}> {translate('cost')}: </Text>
            </View>
            <View>
              <Text style={S.value}> {this.state.cost} </Text>
            </View>
          </View>
        </View>
      )
    }
  }

  render () {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <View style={style.stats}>
            <View>
              {global.canSeeCost && (
                <Text style={S.title}> {translate('cost')}: </Text>
              )}

              <Text style={S.title}> {translate('num_lines')}: </Text>
              <Text style={S.title}> {translate('retail')}: </Text>
            </View>
            <View>
              {global.canSeeCost && (
                <Text style={[S.value, { color: color.total_cost }]}>
                  {this.state.cost}{' '}
                </Text>
              )}
              <Text style={S.value}>{this.state.lines} </Text>
              <Text style={[S.value, { color: color.total_cost }]}>
                {this.state.retail}{' '}
              </Text>
            </View>
          </View>

          <FourTable
            tableData={this.state.tableData}
            tableHead={this.state.tableHead}
            rowPress={this.selectRow}
            costVisible={global.canSeeCost}
          />
        </View>
        <View style={[style.orderPrintPanel]}>
          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(color.btn_selected)}
            onPress={this.toOrder}
          >
            <View style={style.btn}>
              <Text style={style.btnText}> {translate('add_item_tab')} </Text>
            </View>
          </TouchableNativeFeedback>

          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(color.btn_selected)}
            onPress={this.onPrint}
          >
            <View style={style.btn}>
              <Text style={style.btnText}> {translate('print_tab')} </Text>
            </View>
          </TouchableNativeFeedback>

          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(color.btn_selected)}
            onPress={this.tryDelete}
          >
            <View style={style.btn}>
              <Text style={style.btnText}>
                {' '}
                {translate('delete_line_tab')}{' '}
              </Text>
            </View>
          </TouchableNativeFeedback>

          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(color.btn_selected)}
            onPress={() => this.props.navigation.goBack()}
          >
            <View style={style.btn}>
              <Text style={style.btnText}> {translate('back_tab')} </Text>
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
        <DeleteModal
          onDeleteRow={this.deleteRow}
          prompt={translate('delete_order_prompt')}
          visible={this.state.isDeleteModalVisible}
          onHide={this.toggleDeleteModal}
        />
        <TextInput
          style={{ width: 0, height: 0, padding: 0, margin: 0 }}
          showSoftInputOnFocus={false}
          autoFocus={true}
        />
      </View>
    )
  }
}

const style = StyleSheet.create({
  stats: {
    backgroundColor: color.grey,
    justifyContent: 'center',
    padding: 5,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  orderPrintPanel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 2
  },
  btn: {
    padding: 5,
    flex: 1,
    alignItems: 'center',
    borderColor: 'black',
    borderWidth: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    backgroundColor: color.btn_unselected,
    height: 50,
    borderRadius: 5
  },
  btnText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center'
  },
  noDbModal: {
    padding: 0,
    backgroundColor: 'white',
    flexDirection: 'row'
    // justifyContent: 'space-between',
  },
  modalText: {
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: 'white',
    paddingTop: 10,
    paddingBottom: 10,
    marginLeft: 2,
    paddingLeft: 5,
    paddingRight: 3,
    flex: 1
  },
  errorText: {
    fontSize: 18,
    color: 'black'
  },
  smallText: {
    color: 'black',
    fontSize: 14
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
    // borderRadius: 50,
    width: 65,
    height: 100,
    // margin: 5,
    paddingTop: 10,
    paddingBottom: 10
  }
})

const S = StyleSheet.create({
  box: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 3,
    marginLeft: '5%',
    marginRight: '5%'
  },
  title: {
    fontSize: 18,
    color: 'black'
  },
  value: {
    fontSize: 18
  }
})

function Statistic (props) {
  const S = StyleSheet.create({
    box: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 3,
      marginLeft: '5%',
      marginRight: '5%'
    },
    title: {
      fontSize: 18,
      color: 'black'
    },
    value: {
      fontSize: 18
    }
  })
  return (
    <View style={S.box}>
      <View>
        <Text style={S.title}> {props.title} </Text>
      </View>
      <View>
        <Text style={S.value}> {props.value} </Text>
      </View>
    </View>
  )
}

export default addHeader(ReviewOrder, 'review_order')
