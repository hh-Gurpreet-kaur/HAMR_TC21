import React from 'react'
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  Image,
  Keyboard
} from 'react-native'

import Modal from 'react-native-modal'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AwesomeButton from 'react-native-really-awesome-button/src/themes/cartman'

import Input from '../~handMade/rowInput'
import { Item } from '../mainPage/home'
import Images from '../misc/Images'
import Scanning from '../misc/scanning'
import modalStyles from '../../styles/modalStyles'
import Label from '../printing/labels'
import { translate } from '../../translations/langHelpers'
import invStyle from '../../styles/inventoryStyles'
import DeleteModal from '../~handMade/deleteModal'

import Table from '../~handMade/fourTable'
import addHeader from '../../hoc/addHeader'

import sqldb from '../misc/database'
import color from '../../styles/colors'
import Settings from '../settings/settings'
import KeyEvent from 'react-native-keyevent'

export default class MainCount extends React.Component {
  currentScan = ''

  constructor (props) {
    super(props)
    this.state = {
      description: '',
      itemNumber: '',
      mfgNum: '',
      quantity: '',
      scan: '',
      price: '',
      retailPrice: '',
      homeRetailPrice: '',
      uom: '',
      tag: '',
      onHand: '',
      onOrder: '',
      barcodeBg: 'white',
      previousSku: '',
      base64Image: null,
      shouldUpdate: false,
      fieldsEnabled: false,
      canCount: true,
      loading: false,
      isDeleteModalVisible: false,
      tag: ''
    }
  }

  handleKeyEvent = (keyEvent) => {
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
      this.handleScan(this.state.previousSku + this.currentScan)
      this.currentScan = ''
    } else if (keyEvent.pressedKey == '^') {
      this.currentScan = '^'
      global.shouldNavigate = false
    }
  }

  componentDidMount () {
    this.focusListener = this.props.navigation.addListener('didFocus', (e) => {
      setTimeout(() => {
        this._scan.focus()
      }, 100)
      KeyEvent.onKeyUpListener((keyEvent) => {
        this.handleKeyEvent(keyEvent)
      })
    })

    this.blurListener = this.props.navigation.addListener('didBlur', (e) => {
      KeyEvent.removeKeyUpListener()
      this._scan.blur()
    })
  }

  componentDidUpdate (prevProps) {
    if (this.props.tag != prevProps.tag) {
      this.onChangeTag(prevProps.tag, this.props.tag)
    }

    if (this.props.section != prevProps.section) {
      this._scan.focus()
    }
  }

  componentWillUnmount () {
    this.focusListener.remove()
    this.blurListener.remove()
  }

  clearItem =  (saveScan) => {
    const scan = saveScan || ''
    const bg = scan ? color.invalid_scan : 'white'
    this.setState({
      barcodeBg: bg,
      itemNumber: '',
      description: '',
      quantity: '',
      price: '',
      uom: '',
      onHand: '',
      onOrder: '',
      base64Image: null
    })
  }

  findBySku = (sku) => {
    const searchQ = `SELECT
		ItemMaster.SkuNum, 
		ItemMaster.Description, 
		ItemMaster.HomeRetailPrice, 
		ItemMaster.RetailPrice,
		ItemMaster.MfgNum,
		ItemMaster.RetailUnit, 
		ItemMaster.StoreBOH, 
		InventoryCount.Qty,
		ItemMaster.OnOrderQty 
		FROM ItemMaster
		LEFT JOIN InventoryCount on ItemMaster.SkuNum = InventoryCount.SkuNum
		WHERE ItemMaster.SkuNum = ${sku}
		ORDER BY InventoryCountID DESC
		LIMIT 1
		`

    return searchQ
  }

  // find by upc
  findByUpc = (upc) => {
    const searchQ = `
		SELECT ItemMaster.SkuNum,
		ItemMaster.Description,
		ItemMaster.HomeRetailPrice,
		ItemMaster.RetailPrice,
		ItemMaster.MfgNum,
		ItemMaster.RetailUnit,
		ItemMaster.StoreBOH,
		ItemMaster.OnOrderQty,
		InventoryCount.Qty
		FROM ItemMaster
		LEFT JOIN InventoryCount on ItemMaster.SkuNum = InventoryCount.SkuNum
		LEFT JOIN Upc on ItemMaster.SkuNum = Upc.SkuNum
		WHERE Upc.UpcCode = '${upc}'
		`

    return searchQ
  }

  getItem = (query, type, upc) => {
    // get result object
    sqldb.executeReader(query).then((results) => {
      const len = results.length
      // item found
      if (len > 0) {
        this.state.loading = true
        this.parseResults(results)
      } else {
        if (type == 'sku') {
          // sku not found
          this.state.barcodeBg = color.invalid_scan
          this.clearItem(this.state.scan)
        } else {
          const existsQuery = `SELECT Qty FROM [InventoryCount] WHERE UpcCode='${upc}'`
          let qty = '0'
          let update = false
          let barcodeBg = color.invalid_scan
          // check if barcode exists in inventoryCount
          sqldb.executeReader(existsQuery).then((results) => {
            if (results.length > 0) {
              // Barcode exists, update qty
              qty = results.item(0).Qty.toString()
              update = true
              barcodeBg = 'white'
            }

            if (!this.state.loading) {
              this.setState({
                barcodeBg,
                itemNumber: '',
                description: translate('not_on_file'),
                quantity: qty,
                price: '',
                uom: '',
                onHand: '',
                onOrder: '',
                base64Image: null,
                shouldUpdate: update
              })
            } else {
              this.state.loading = false
            }
          })
        }
      }
    })
  }

  parseResults = (results) => {
    const x = results.item(0)

    const price = x.RetailPrice > 0 ? x.RetailPrice : x.HomeRetailPrice
    let qty = '1'

    if (x.Qty == null) {
      this.state.shouldUpdate = false
    } else {
      this.state.shouldUpdate = true
      qty = x.Qty.toString()
    }

    this.setState({
      itemNumber: x.SkuNum.toString(),
      previousSku: x.SkuNum.toString(),
      scan: x.SkuNum.toString(),
      barcodeBg: 'white',
      description: x.Description,
      quantity: '1',
      price,
      retailPrice: x.RetailPrice,
      homeRetailPrice: x.HomeRetailPrice,
      uom: x.RetailUnit,
      onHand: x.StoreBOH,
      onOrder: x.OnOrderQty
    })

    if (Settings.autoPrint) {
      this.pressPrint()
    }

    this.getImage(x.SkuNum)
  }

  handleItem = async (sku, isScan) => {
    this.setState({
      scan: sku
    })
    if (sku == this.state.previousSku) {
      // same scan
      this.setState({
        quantity: (Number(this.state.quantity) + 1).toString()
      })

      if (Settings.autoPrint) {
        this.pressPrint()
      }
    } else {
      if (isScan && this.state.previousSku != '') {
        if (this.state.itemNumber != '') {
          this.addBySku()
        } else {
          this.addByUpc()
        }
      }

      if (sku.indexOf('^') != -1) {
        this.setState({
          scan: sku
        })
      } else {
        this.setState({
          scan: sku,
          previousScan: sku,
          previousSku: sku
        })

        if (sku.length >= 11 && sku.indexOf('^') == -1) {
          const upc = await Scanning.checkHomeUpc(sku)
          if (upc.length <= 7) {
            this.getItem(this.findBySku(upc), 'sku')
          } else {
            this.getItem(this.findByUpc(upc), 'upc', upc)
          }
        } else {
          this.getItem(this.findBySku(sku), 'sku')
        }
      }
    }
  }

  handleScan = async (scan) => {
    let cleanedScan = ''
    const index = scan.indexOf('|')
    if (index != -1) {
      // pipe ('|') at end of string means barcode was scanned
      cleanedScan = scan.substring(0, index)
      cleanedScan = cleanedScan.slice(this.state.previousSku.length + 1)

      const upc = await Scanning.checkHomeUpc(cleanedScan)

      if (upc.length <= 7) {
        this.handleItem(upc, true)
      } else if (upc.length >= 11) {
        if (upc == this.state.previousScan) {
          // same scan
          this.setState({
            quantity: (Number(this.state.quantity) + 1).toString(),
            scan: this.state.previousSku
          })

          if (Settings.autoPrint) {
            this.pressPrint()
          }
        } else {
          if (this.state.previousSku != '') {
            if (this.state.itemNumber != '') {
              this.addBySku()
            } else {
              this.addByUpc()
            }
          }

          this.setState({
            previousScan: upc,
            scan: upc,
            previousSku: upc
          })

          this.getItem(this.findByUpc(upc), 'barcode', upc)
        }
      }
    } else if (scan.length <= 7 || scan.length >= 11) {
      this.handleItem(scan, false)
    } else if (scan.length == 0) {
      this.setState({
        scan,
        previousSku: scan
      })
    } else {
      this.setState({
        scan,
        barcodeBg: 'white'
      })
    }
  }

  addBySku = () => {
    this.props.addBySku(
      this.state.itemNumber,
      this.state.quantity,
      this.state.description
    )
  }

  addByUpc = () => {
    this.props.addByUpc(
      this.state.previousSku,
      this.state.quantity,
      this.state.description
    )
  }

  onCountPressed = () => {
    if (this.state.scan.length > 0) {
      if (this.state.itemNumber != '') {
        this.addBySku(this.state.itemNumber)
      } else {
        this.addByUpc(this.state.previousSku)
      }

      this.state.scan = ''
      this.state.previousSku = ''
      this.clearItem()
    }
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
		DELETE FROM [InventoryCount]
		WHERE InventoryCountID IN 
		(
			SELECT InventoryCountID from InventoryCount
			WHERE SkuNum = ${this.state.itemNumber}
			ORDER BY InventoryCountID DESC
			LIMIT 1
		)
		`
    sqldb.executeQuery(query)
    this.state.scan = ''
    this.state.previousSku = ''
    this.clearItem()
  }

  pressPrint = () => {
    this.props.pressPrint(this.state.itemNumber)
  }

  changeQuantity = (q) => {
    if (q.includes('|')) {
      const scan = q.split('^')
      this._scan.focus()
      Keyboard.dismiss()
      this.handleScan(this.state.scan + '^' + scan[1])
    } else {
      if (!q.includes('^')) {
        this.setState({
          quantity: q.slice(0, 5)
        })
      }
    }
  }

  onChangeTag = (tag, text) => {
    if (text.includes('|')) {
      const scan = text.split('^')
      this._scan.focus()
      Keyboard.dismiss()
      this.props.onChangeTag(tag)
      this.handleScan(this.state.scan + '^' + scan[1])
    } else {
      if (!text.includes('^')) {
        this.setState({
          tag: text
        })
      }
    }
  }

  getImage = async (sku) => {
    const image = await Images.getImage(sku)
    this.setState({
      base64Image: image
    })
  }

  renderImage () {
    if (this.state.base64Image != null) {
      return (
        <Image
          source={{ uri: `data:image/jpg;base64,${this.state.base64Image}` }}
          style={invStyle.img}
        />
      )
    } else {
      return (
        <Image
          source={require('../../assets/img/hh_grayscale.png')}
          style={invStyle.img}
        />
      )
    }
  }

  
  renderText () {
  
      return (
        <View
        style={{ width: '100%', alignSelf: 'center', paddingHorizontal: 10 }}
      >
        <TextInput
          ref={(input) => (this._scan = input)}
          placeholder={translate('scan_or_enter')}
          keyboardType={'numeric'}
          value={this.state.scan}
          style={[invStyle.input, { backgroundColor: this.state.barcodeBg }]}
          onChangeText={this.handleScan}
          showSoftInputOnFocus={Settings.showNumpad}
          autoFocus={true}
        />

    </View>
      )
    }
  

  render () {
    let price = ''
    if (this.state.price != '') {
      price = '$' + this.state.price.toFixed(2)
    }

    return (
      <View
        style={{ width: '100%', alignSelf: 'center', paddingHorizontal: 10 }}
      >
        <TextInput
          ref={(input) => (this._scan = input)}
          placeholder={translate('scan_or_enter')}
          keyboardType={'numeric'}
          value={this.state.scan}
          style={[invStyle.input, { backgroundColor: this.state.barcodeBg }]}
          onChangeText={this.handleScan}
          showSoftInputOnFocus={Settings.showNumpad}
          autoFocus={true}
        />

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            width: '100%',
            justifyContent: 'space-between'
          }}
        >
          <View style={invStyle.imgBox}>{this.renderImage()}</View>
          <View style={{ flex: 1, marginTop: 5, alignItems: 'flex-end' }}>
            <View style={invStyle.textValue}>
              <Text style={invStyle.defaultText}>{price}</Text>
            </View>
            <View style={invStyle.textValue}>
              <Text style={invStyle.defaultText}>{this.state.uom}</Text>
            </View>
            <View style={invStyle.textValue}>
              <Text style={invStyle.defaultText}>{this.state.itemNumber}</Text>
            </View>
          </View>
        </View>

        <View style={invStyle.descBox}>
          <Text style={invStyle.description}>{this.state.description}</Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Text style={invStyle.largeText}>{translate('qty_caps')}:</Text>
          <TextInput
            textAlign={'center'}
            keyboardType={'numeric'}
            value={this.state.quantity}
            selectTextOnFocus={true}
            onChangeText={this.changeQuantity}
            style={invStyle.qtyInput}
            showSoftInputOnFocus={Settings.showNumpad}
          />

          <AwesomeButton
            backgroundColor={color.light_green}
            backgroundDarker={color.light_green_darker}
            textSize={22}
            width={150}
            height={50}
            textColor={'white'}
            borderColor={color.light_green_darker}
            onPress={this.onCountPressed}
          >
            <Text style={{ fontSize: 20, color: 'white', fontWeight: 'bold' }}>
              {translate('count_btn')}
            </Text>
          </AwesomeButton>
        </View>

        {global.isThirdParty && (
          <DualRowDisplay
            title={translate('on_hand_caps')}
            value={this.state.onHand}
            titleRight={translate('on_order_caps')}
            valueRight={this.state.onOrder}
          />
        )}

        <View style={invStyle.deletePrintPanel}>
          <AwesomeButton
            backgroundColor={color.pink}
            backgroundDarker={color.pink_darker}
            textSize={22}
            width={140}
            height={43}
            textColor={'white'}
            borderColor={color.pink_darker}
            onPress={this.pressPrint}
          >
            <Icon name={'printer-wireless'} size={25} color="white" />
            <Text style={{ fontSize: 19, color: 'white', fontWeight: 'bold' }}>
              {translate('print_btn')}
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
            <Text style={{ fontSize: 19, color: 'white', fontWeight: 'bold' }}>
              {translate('delete_btn_caps')}
            </Text>
          </AwesomeButton>
        </View>
        <DeleteModal
          onDeleteRow={this.pressDelete}
          prompt={translate('delete_line_prompt', {
            itemNumber: this.state.scan
          })}
          visible={this.state.isDeleteModalVisible}
          onHide={this.toggleDeleteModal}
        />
      </View>
    )
  }
}

export function DualRowDisplay (props) {
  const styleRow = StyleSheet.create({
    rows: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginTop: 7
      // backgroundColor: 'red'
    },
    textTitle: {},
    previousUpc: {
      backgroundColor: color.light_grey,
      padding: 5,
      width: 70
    },
    defaultText: {
      color: 'black',
      fontSize: 12
    },
    column: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      width: '50%'
    }
  })

  if (props.valueStyle) {
    return (
      <View style={styleRow.rows}>
        <View style={styleRow.column}>
          <View style={styleRow.textTitle}>
            <Text style={styleRow.defaultText}>{props.title}:</Text>
          </View>
          <View style={styleRow.previousUpc}>
            <Text
              style={[
                styleRow.defaultText,
                { textAlign: 'center' },
                props.valueStyle
              ]}
            >
              {' '}
              {props.value}{' '}
            </Text>
          </View>
        </View>
        <View style={styleRow.column}>
          <View style={styleRow.textTitle}>
            <Text style={styleRow.defaultText}>{props.titleRight}:</Text>
          </View>
          <View style={styleRow.previousUpc}>
            <Text
              style={[
                styleRow.defaultText,
                { textAlign: 'center' },
                props.valueStyleRight
              ]}
            >
              {' '}
              {props.valueRight}{' '}
            </Text>
          </View>
        </View>
      </View>
    )
  } else {
    return (
      <View style={styleRow.rows}>
        <View style={[styleRow.column, { paddingRight: 12 }]}>
          <View style={styleRow.textTitle}>
            <Text style={styleRow.defaultText}>{props.title}: </Text>
          </View>
          <View style={styleRow.previousUpc}>
            <Text style={[styleRow.defaultText, { textAlign: 'center' }]}>
              {' '}
              {props.value}{' '}
            </Text>
          </View>
        </View>
        <View style={styleRow.column}>
          <View style={styleRow.textTitle}>
            <Text style={styleRow.defaultText}>{props.titleRight}: </Text>
          </View>
          <View style={styleRow.previousUpc}>
            <Text style={[styleRow.defaultText, { textAlign: 'center' }]}>
              {' '}
              {props.valueRight}{' '}
            </Text>
          </View>
        </View>
      </View>
    )
  }
}
