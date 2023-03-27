import React from 'react'
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableNativeFeedback
} from 'react-native'

import addHeader from '../../hoc/addHeader'
import { translate } from '../../translations/langHelpers'
import { TextInput } from 'react-native-gesture-handler'

import color from '../../styles/colors'
import sqldb from '../misc/database'

import Analytics from '../../analytics/ga'

class OrderInfo extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      onOrder: '0',
      totalOrders: '0',
      modifiedOrders: '0',
      booth: '',
      supplierName: ''
    }
  }

  componentDidMount () {
    Analytics.trackScreenView('Order Info')
    this.getData()
  }

  getData () {
    let onOrder = '0'
    let totalOrders = '0'
    let modifiedOrders = '0'
    let booth = ''
    let supplierName = ''
    const qOnOrder = 'SELECT COUNT(*) as Count FROM Market'
    const qTotalOrders = 'SELECT SkuNum from MarketOrder UNION SELECT SkuNum from Market WHERE OrderQty != 0'
    const qModifiedOrders = 'SELECT COUNT(*) as Count FROM MarketOrder'

    const sku = this.props.navigation.getParam('sku', '')
    const qBooth = `SELECT Market.Booth, 
				ifnull(Supplier.SupplierName, '') as SupplierName
				FROM Market 
				LEFT JOIN ItemMaster ON ItemMaster.SkuNum = Market.SkuNum
				LEFT JOIN Supplier ON Supplier.HomeSupplierID = ItemMaster.HomeSupplierId
				WHERE Market.SkuNum = ${sku}`

    sqldb.executeReader(qOnOrder).then((results) => {
      onOrder = results.item(0).Count.toString()
      this.setState({ onOrder })
    })

    sqldb.executeReader(qTotalOrders).then((results) => {
      const rows = []
      for (i = 0; i < results.length; i++) {
        rows.push(results.item(i).SkuNum.toString())
      }
      // get unique rows
      const unique = [...new Set(rows)]
      totalOrders = unique.length.toString()
      this.setState({ totalOrders })
    })

    sqldb.executeReader(qModifiedOrders).then((results) => {
      modifiedOrders = results.item(0).Count.toString()
      this.setState({ modifiedOrders })
    })

    if (sku != '') {
      sqldb.executeReader(qBooth).then((results) => {
        booth = results.item(0).Booth.toString()
        supplierName = results.item(0).SupplierName.toString()
        this.setState({
          booth,
          supplierName
        })
      })
    }
  }

  renderSupplier () {
    if (this.state.supplierName != '') {
      return (
				<Text style={{ paddingLeft: 5, fontSize: 20 }}>{this.state.supplierName}</Text>
      )
    }
  }

  render () {
    return (
		<View style={{ flex: 1 }}>
			<View style={style.container}>

				<View style={[style.heading, { marginTop: 20 }]}>
					<Text style={style.bigText}>{translate('order_information')} </Text>
				</View>

				<View style={style.section}>
					<RowText one={translate('items_on_order')} two={this.state.onOrder} />
					<RowText one={translate('total_orders')} two={this.state.totalOrders} />
					<RowText one={translate('modified_orders')} two={this.state.modifiedOrders} />
				</View>

				<View style={[style.heading]}>
					<Text style={style.bigText}>{translate('booth')} </Text>
					{ this.renderSupplier() }
					<Text style={{ paddingLeft: 5, fontSize: 20 }}>{this.state.booth}</Text>
				</View>
			</View>
			<View style={style.orderPrintPanel}>
				<TouchableNativeFeedback
					background={TouchableNativeFeedback.Ripple(color.btn_selected)}
					onPress={() => this.props.navigation.navigate('DetailedEntry_MarketOrder')}>
					<View style={style.btn}>
						<Text style={style.btnText}> {translate('item_details_tab')}</Text>
					</View>
				</TouchableNativeFeedback>

				<TouchableNativeFeedback
					background={TouchableNativeFeedback.Ripple(color.btn_selected)}
					onPress={() => { this.props.navigation.navigate('ReviewMarketOrder') }}>
					<View style={style.btn}>
						<Text style={style.btnText}> {translate('order_review_tab')} </Text>
					</View>
				</TouchableNativeFeedback>

				<TouchableNativeFeedback
					background={TouchableNativeFeedback.Ripple(color.btn_selected)}
					>
					<View style={[style.btn, style.btnSelected]}>
						<Text style={style.btnText}> {translate('order_info_tab')} </Text>
					</View>
				</TouchableNativeFeedback>
			</View>
		</View>
    )
  }
}

function RowText (props) {
  return (
		<View style={style.split}>

			<Text style={style.text}>{props.one}:</Text>
			<TextInput
				style={style.input}
				value={props.two}
				editable={false}
			/>
		</View>
  )
}

const style = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1
  },
  heading: {
    paddingLeft: 10
  },
  headingRow: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 10
  },
  section: {
    padding: 5,
    marginBottom: 10
  },
  bigText: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  text: {
    fontSize: 16
  },
  input: {
    fontSize: 16,
    width: 70,
    padding: 5,
    borderWidth: 1,
    color: 'black',
    borderColor: 'grey'
  },
  split: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 5,
    alignItems: 'center'
  },
  orderPrintPanel: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 2
  },
  btn: {
    padding: 5,
    alignItems: 'center',
    borderColor: 'black',
    borderWidth: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    backgroundColor: color.btn_unselected,
    height: 50,
    borderRadius: 5,
    width: '33%'
  },
  btnText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center'
  },
  btnSelected: {
    backgroundColor: color.btn_selected
  }
})

export default addHeader(OrderInfo, 'market_order')
