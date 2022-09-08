import React from 'react'
import {
	Text,
	View,
	StyleSheet,
	TextInput,
	TouchableNativeFeedback
} from 'react-native'

import Table from '../~handMade/fourTable'
import addHeader from '../../hoc/addHeader'
import DeleteModal from '../~handMade/deleteModal'

import { translate } from '../../translations/langHelpers'
import color from '../../styles/colors'
import sqldb from '../misc/database';

import Analytics from '../../analytics/ga';


class OrderReviewMarketOrder extends React.Component {

	constructor(props) {
		super(props)
		this.state =  {
			tableHead: [
				translate("item_no"),
				translate("qty"),
				translate("ext_cost"),
				translate("description")
			],
			tableData: [],
			cost: '$0.00',
			retail: '$0.00',
			lines: 0,
			selected: null,
			isDeleteModalVisible: false
		}

		this.deleteColor = color.delete_line
	}

	componentDidMount() {
		Analytics.trackScreenView("Review Market Order");
		this.initDb();
	}


	// ````````````BACKEND FUNCTIONS``````````````

	initDb = () => {
		this.start();
	}

	start = () => {
		this.getResults(`SELECT MarketOrder.*, 
		ifnull(Market.Description, '${translate('not_on_file')}') as Description,
		Market.RetailPrice, Market.Cost 
		FROM MarketOrder LEFT JOIN Market 
		ON MarketOrder.SkuNum = Market.SkuNum`)
	}

	// select row, color selected
	// uncolor unselected
	selectRow = (data) => {
		let ans = []
		let len = this.state.tableData.length
		let selected = -1;

		for (var i=0; i<len; ++i) {
			let x = this.state.tableData[i]

			let back = i % 2 == 0 ? color.grey : 'white'

			if (x.key == data.upc) {
				back = this.deleteColor
				selected = x.key;
			}

			ans.push({
				key: x.key,
				descr: x.descr,
				boh: x.boh,
				item: x.item,
				cost: x.cost,
				retailPrice: x.retailPrice,
				back: back
			})
		}

		this.setState({
			tableData: ans,
			selected: selected
		})
	}


	getResults = (q) => {
		sqldb.executeReader(q).then((results) => {
			let len = results.length

			if (len > 0) {
				this.parseResults(results)
			} else {
				// Market Order Table Empty!
			}

		})
	}


	parseResults = (results) => {
		let len = results.length

		let ans = []
		for (var i=0; i<len; i++) {
			let x = results.item(i)
			let extCost = x.Qty * x.Cost

			ans.push({
				key: x.SkuNum,
				descr: x.Description,
				boh: extCost.toFixed(2),
				retailPrice: x.RetailPrice,
				item: x.Qty,
				back: i%2 == 0 ? color.grey : 'white',
				cost: x.Cost
			})
		}

		this.setState({
			tableData: ans
		})

		this.stats()
	}

	stats = () => { 
		let len = this.state.tableData.length

		let cost = 0, retail = 0
		for (var i=0; i<len; ++i) {
			let x = this.state.tableData[i]

			cost += (x.item * x.cost)
			retail += (x.item * x.retailPrice)
		}

		this.setState({
			cost: '$' + cost.toFixed(2),
			lines: len,
			retail: '$' + retail.toFixed(2)
		})
	}

	tryDelete = () => {
		if (this.state.selected != null) {
			this.toggleDeleteModal();
		}
	}

	toggleDeleteModal = () => {
		this.setState({ 
			isDeleteModalVisible: !this.state.isDeleteModalVisible,
		 });

	}

	deleteLine = () => {
		this.toggleDeleteModal();
		let len = this.state.tableData.length
		let ans = []
		for (var i=0; i<len; ++i) {
			let x = this.state.tableData[i]

			if (x.back != color.delete_line) {
				ans.push(x)
			} else {
				let q = `DELETE FROM MarketOrder WHERE SkuNum = ${x.key}`;
				sqldb.executeQuery(q);
			}
		}

		this.state.tableData = ans;
		this.state.selected = null;

		this.stats();
	}



	// ``````````````DEBUG FUNCTIONS``````````````

	log = (s) => {
		let debug = true
		if (debug) {
			console.log(s)
		}
	}



	render() {
		return(
			<View style={{flex: 1, width: "100%"}}>
				<View style={{flex: 1}}>

					<View style={style.stats}>
						<View>
							{ global.canSeeCost &&
								<Text style={S.title}> {translate("cost")}: </Text>
							}
							
							<Text style={S.title}> {translate("num_lines")}: </Text>
							<Text style={S.title}> {translate("retail")}: </Text>
						</View>
						<View>
							{ global.canSeeCost &&
								<Text style={[S.value, {color: color.total_cost}]}>{this.state.cost} </Text>
							}
							<Text style={S.value}>{this.state.lines} </Text>
							<Text style={[S.value, {color: color.total_cost}]}>{this.state.retail} </Text>
						</View>
					</View>

					<Table
						tableHead={this.state.tableHead}
						tableData={this.state.tableData}
						rowPress={this.selectRow} 
						costVisible={global.canSeeCost}/>

				</View>
				<View style={[style.orderPrintPanel]}>
				<TouchableNativeFeedback 
					background={TouchableNativeFeedback.Ripple(color.btn_selected)}
					onPress={() => this.props.navigation.navigate('DetailedEntry_MarketOrder', {sku: this.state.selected})}>
					<View style={style.btn}>
						<Text style={style.btnText}> {translate("item_details_tab")}</Text>
					</View>
				</TouchableNativeFeedback>

				<TouchableNativeFeedback 
					background={TouchableNativeFeedback.Ripple(color.btn_selected)}
					onPress={this.toOrderReview}>
					<View style={[style.btn, style.btnSelected]}>
						<Text style={style.btnText}> {translate("order_review_tab")} </Text>
					</View>
				</TouchableNativeFeedback>

				<TouchableNativeFeedback 
					background={TouchableNativeFeedback.Ripple(color.btn_selected)}
					onPress={() => this.props.navigation.navigate('OrderInfo', {sku: this.state.selected})}>
					<View style={style.btn}>
						<Text style={style.btnText}> {translate("order_info_tab")} </Text>
					</View>
				</TouchableNativeFeedback>
				<TouchableNativeFeedback 
					background={TouchableNativeFeedback.Ripple(color.btn_selected)}
					onPress={this.tryDelete}>
					<View style={style.btn}>
						<Text style={style.btnText}> {translate("delete_line_tab")} </Text>
					</View>
				</TouchableNativeFeedback>
			</View>
			<DeleteModal
					onDeleteRow={this.deleteLine}
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

function Statistic(props) {
	const style = StyleSheet.create({
		box: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			padding: 3,
			marginLeft: "5%",
			marginRight: "5%",

		},
		title: {
			fontSize: 20,
			color: 'black'
		},
		value: {
			fontSize: 20
		}
	})
	return(
		<View style = {style.box}>
			<Text style={style.title}> {props.title} </Text>
			<Text style={style.value}> {props.value} </Text>
		</View>
	)
}


const S = StyleSheet.create({
	box: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 3,
		marginLeft: "5%",
		marginRight: "5%",

	},
	title: {
		fontSize: 18,
		color: 'black'
	},
	value: {
		fontSize: 18,
	}
})

let style = StyleSheet.create({
	stats: {
		backgroundColor: color.grey,
		justifyContent: 'center',
		padding: 5,
		flexDirection: "row",
		justifyContent: "space-between"
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
	btnSelected: {
		backgroundColor: color.btn_selected
	}


	})

export default addHeader(OrderReviewMarketOrder, 'Review Order')