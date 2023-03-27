import React from 'react'
import { Text, View, ScrollView, TouchableNativeFeedback } from 'react-native'

import Modal from 'react-native-modal'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { Item } from '../mainPage/home'
import MainCount from './countComponent'
import modalStyles from '../../styles/modalStyles'
import Label from '../printing/labels'
import { translate } from '../../translations/langHelpers'
import invStyle from '../../styles/inventoryStyles'

import addHeader from '../../hoc/addHeader'

import sqldb from '../misc/database'
import color from '../../styles/colors'
import Settings from '../settings/settings'
import KeyEvent from 'react-native-keyevent'

import Analytics from '../../analytics/ga'

class MainSpotCheck extends React.Component {
  static navigationOptions = {
    header: null
  }

  modalSku = ''
  modalDesc = ''
  modalQuantity = ''

  constructor (props) {
    super(props)
    this.state = {
      isModalVisible: false,
      isPrintModalVisible: false,
      modalText: ''
    }
  }

  componentDidMount () {
    Analytics.trackScreenView('Spot Check')
  }

  addBySku = (sku, quantity, description) => {
    const startDate = this.getCurrDate()
    let query = ''

    query = `INSERT INTO [InventoryCount](SkuNum,Qty,EmployeeID,StartDate)
		VALUES (${sku},${quantity.toString()},${global.employeeId},'${startDate}')`

    this.addInventory(query, sku, quantity, description)
  }

  addByUpc = (upc, quantity, description) => {
    const startDate = this.getCurrDate()
    let query = ''

    query = `INSERT INTO [InventoryCount](UpcCode,Qty,EmployeeID,StartDate)
			VALUES (${upc},${quantity.toString()},${global.employeeId},'${startDate}')`

    this.addInventory(query, upc, quantity, description)
  }

  addInventory = (query, sku, quantity, description) => {
    if (Number(quantity) >= 0) {
      this.modalSku = sku
      if (this.modalSku != '') this.modalSku += ' - '
      this.modalDesc = description
      this.modalQuantity = quantity

      sqldb.executeQuery(query)
     // this.timedModal()
    }
  }

  getCurrDate = () => {
    const year = new Date().getFullYear()
    const month = new Date().getMonth() + 1
    const day = ('0' + new Date().getDate()).slice(-2)

    return year + '-' + month + '-' + day
  }

  pressPrint = async (sku) => {
    let modalText = ''
    let printSuccess = true

    if (sku != '') {
      this.state.modalText = translate('connecting_printer')
      this.togglePrintModal()
      if (Settings.labelType == "shelf" && Settings.printType == "pb32") {
        printSuccess = await Label.PrintLabel(
          "shelf",
          "pb32",
          sku,
          Settings.printerAddress
        );
        modalText = "shelf";
      } 
      else if (Settings.labelType == "upc" && Settings.printType == "pb32"){
        printSuccess = await Label.PrintLabel(
          "upc",
          "pb32",
          sku,
          Settings.printerAddress
        );
        modalText = "UPC";
      } 
      else if (Settings.labelType == "shelf" && Settings.printType == "zebra") {
        printSuccess = await Label.PrintLabel(
          "shelf",
          "zebra",
          sku,
          Settings.printerAddress
        );
        modalText = "shelf";
      } 
      else if (Settings.labelType == "upc" && Settings.printType == "zebra")  {
        printSuccess = await Label.PrintLabel(
          "upc",
          "zebra",
          sku,
          Settings.printerAddress
        );
        modalText = "UPC";
      }

      if (printSuccess === true) {
        this.setState({
          modalText: translate('printing_label', {
            labelType: modalText,
            itemNumber: sku
          })
        })
        this.timedPrintModal()
      } else {
        alert(printSuccess)
        this.togglePrintModal()
      }
    }
  }

  // HELPERS

  log = (s) => {
    const debug = true
    if (debug) {
      console.log(s)
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
      setTimeout(this.toggleModal, 3000)
    }
  }

  togglePrintModal = () => {
    this.setState({
      isPrintModalVisible: !this.state.isPrintModalVisible
    })
  }

  timedPrintModal = () => {
    setTimeout(this.togglePrintModal, 4000)
  }

  render () {
    return (
      <View style={{ flex: 1, width: '100%' }}>
        <View style={{ height: 377, width: '100%' }}>
          <ScrollView
            style={invStyle.container}
            keyboardShouldPersistTaps={'handled'}
          >
            <Item
              title={translate('spot_check_title')}
              back={color.light_grey}
              icon={'box'}
              iconLib={'Feather'}
              iconColor={color.heading}
            />

            <MainCount
              addBySku={this.addBySku}
              addByUpc={this.addByUpc}
              pressPrint={this.pressPrint}
              navigation={this.props.navigation}
            />
          </ScrollView>
        </View>
        <View style={[invStyle.orderPrintPanel]}>
          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(color.btn_selected)}
          >
            <View style={[invStyle.btn, invStyle.btnSelected]}>
              <Text style={invStyle.btnText}>
                {translate('spot_check_tab')}
              </Text>
            </View>
          </TouchableNativeFeedback>

          <TouchableNativeFeedback
            background={TouchableNativeFeedback.Ripple(color.btn_selected)}
            onPress={() => this.props.navigation.navigate('ReviewSpotCheck')}
          >
            <View style={[invStyle.btn]}>
              <Text style={invStyle.btnText}>
                {translate('review_inventory_tab')}
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
          <View style={invStyle.noDbModal}>
            <View style={invStyle.icon}>
              <Icon name={'check-circle'} size={50} color={color.light_green} />
            </View>
            <View style={invStyle.modalText}>
              <Text style={invStyle.smallText}>
                {this.modalSku}
                {this.modalDesc}
              </Text>
              <Text style={invStyle.smallText}>
                {' '}
                {translate('counted_qty')} {this.modalQuantity}{' '}
              </Text>
            </View>
          </View>
        </Modal>
        <Modal
          isVisible={this.state.isPrintModalVisible}
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

export default addHeader(MainSpotCheck, 'inventory')
