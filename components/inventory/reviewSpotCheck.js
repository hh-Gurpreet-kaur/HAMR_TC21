import React from 'react'
import {
	View,
	Text,
	ScrollView,
	StyleSheet,
	TextInput,
	TouchableNativeFeedback,
	Image
} from 'react-native'

import {Item} from '../mainPage/home'

import FourTable from '../~handMade/fourTable'
import { translate } from '../../translations/langHelpers'
import color from '../../styles/colors'
import DeleteModal from '../~handMade/deleteModal'

import addHeader from '../../hoc/addHeader'

import sqldb from '../misc/database';

class ReviewSpotCheck extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			tableHead: [
				translate("item_no"),
				translate("qty"),
				translate("cost"),
				translate("description")
			],
			tableData: [],
			cost: '$0.00',
			lines: '0',
			selected: null,
			isDeleteModalVisible: false
		}

		this.deleteColor = color.delete_line
	}

	componentDidMount() {
		this.start();
		this.focusListener = this.props.navigation.addListener("didFocus", this.start);
	}

	componentWillUnmount() {
		this.focusListener.remove();
	}

	start = () => {
		this.getResults()
	}

	getResults = () => {
		let q = `SELECT [InventoryCount].InventoryCountID as Id, [InventoryCount].SkuNum as SkuNum, 
		[InventoryCount].Qty as Qty, [ItemSupplier].AcctCost as AcctCost, 
		[ItemMaster].Description as Description FROM [InventoryCount] 
			LEFT JOIN [ItemMaster] ON [ItemMaster].SkuNum = [InventoryCount].SkuNum 
			LEFT JOIN ItemSupplier ON ItemSupplier.SkuNum = [InventoryCount].SkuNum
			WHERE [InventoryCount].SkuNum IS NOT NULL 
			AND [InventoryCount].Tag IS NULL AND [InventoryCount].Location IS NULL
			UNION
			SELECT InventoryCountID, UpcCode, Qty, '', ifnull(Description, '${translate('not_on_file')}') FROM InventoryCount
			WHERE SkuNum IS NULL
			AND [InventoryCount].Tag IS NULL AND [InventoryCount].Location IS NULL`

		// clean command
		let del = `DELETE FROM [InventoryCount]`
		
		sqldb.executeReader(q).then((results) => {
			if (results.length == 0) {
				console.log('inventory count table empty?')
			} else {
				try{
					this.parseResults(results)
				} catch (e) {
					console.log(e);
				}
			}
		})
	}

	parseResults = (results) => {
		// retrieve all the rows
		let data = []
		let len = results.length
		for (var i=0; i<len; ++i) {
			let x = results.item(i)
			let cost = x.AcctCost ? x.AcctCost.toFixed(2) : ""
			let inventory = {
				id: x.Id,
				key: x.SkuNum.toString(),
				item: x.Qty,
				boh: cost,
				descr: x.Description,
				back: i % 2 == 0 ? color.grey : 'white'
			}
			data.push(inventory)
		}

		// update all the rows to render
		this.setState({
			tableData : data
		})

		this.updateStatus()
	}

	selectRow = (data) => {
		let ans = []
		let len = this.state.tableData.length

		for (var i=0; i<len; ++i) {
			let x = this.state.tableData[i]

			let back = i % 2 == 0 ? color.grey : 'white'

			if (i == data.index) {
				back = this.deleteColor;
				selected = i;
			}

			ans.push({
				id: x.id,
				key : x.key,
				boh: x.boh,
				descr: x.descr,
				item: x.item,
				back : back,
			})
		}

		this.setState({
			tableData: ans,
			selected: selected
		})
	}

	tryDelete = () => {
		if (this.state.selected != null) {
			this.toggleDeleteModal();
		}
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
				let query = `
				DELETE FROM [InventoryCount]
				WHERE InventoryCountID = ${x.id}
				`
				sqldb.executeQuery(query);
			}
		}

		this.state.tableData = ans;
		this.state.selected = null;

		this.updateStatus();
	}

	updateStatus = () => {
		let cost = 0
		let len = this.state.tableData.length

		for (var i=0; i<len; ++i) {
			let x = this.state.tableData[i]

			cost += x.boh * x.item
		}

		this.setState({
			cost: '$' + cost.toFixed(2),
			lines: len,
		})

	}

	getCountPage(page) {
		let pageCaption = "";
		switch (page) {
			case "fullCount": 
				pageCaption = translate('full_count_tab');
				break;
			case "cycleCount": 
				pageCaption = translate('cycle_count_tab');
				break;
			case "spotCheck": 
				pageCaption = translate('spot_check_tab');
				break;
			default:
				pageCaption = translate('full_count_tab');
		}

		return pageCaption;
	}

	toggleDeleteModal = () => {
		this.setState({ 
			isDeleteModalVisible: !this.state.isDeleteModalVisible,
		 });
	}

	render() {
		let pageCaption = translate('spot_check_tab');

		return (
		<View style={{flex: 1}}>
			<View style={{flex: 1}}>

				<View style={style.stats}>
					<View>
						{ global.canSeeCost &&
							<Text style={S.title}> {translate("cost")}: </Text>
						}
						<Text style={S.title}> {translate("num_lines")}: </Text>
					</View>
					<View>
						{ global.canSeeCost &&
							<Text style={[S.value, {color: color.light_green}]}> {this.state.cost} </Text>
						}
						<Text style={S.value}> {this.state.lines} </Text>
					</View>
				</View>

				<FourTable
					tableData={this.state.tableData}
					tableHead={this.state.tableHead} 
					rowPress={this.selectRow}
					costVisible={global.canSeeCost}/>

			</View>
			<View style={[style.orderPrintPanel]}>
				<TouchableNativeFeedback 
				 background={TouchableNativeFeedback.Ripple(color.btn_selected)}
				 onPress={() => this.props.navigation.goBack()}>
					<View style={style.btn}>
						<Text style={style.btnText}>{ pageCaption }</Text>
					</View>
				</TouchableNativeFeedback>

				<TouchableNativeFeedback 
				 background={TouchableNativeFeedback.Ripple(color.btn_selected)}>
				 
					<View style={[style.btn, style.btnSelected]}>
						<Text style={style.btnText}>{translate('review_inventory_tab')}</Text>
					</View>
				</TouchableNativeFeedback>
				<TouchableNativeFeedback 
					background={TouchableNativeFeedback.Ripple(color.btn_selected)}
					onPress={this.tryDelete}>
					<View style={style.btn}>
						<Text style={style.btnText}> {translate("delete_line_tab_caps")} </Text>
					</View>
				</TouchableNativeFeedback>
			</View>
			<DeleteModal
				onDeleteRow={this.deleteLine}
				prompt={translate('delete_count_prompt')}
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
		flexDirection: "row",
		justifyContent: "space-between"
	},
	orderPrintPanel: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: "center",
		width: "100%",
		marginTop: 2,
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
		width: "33%"
	},
	btnText: {
		fontSize: 16,
		color: 'black',
		textAlign: 'center'
	},
	btnSelected: {
        backgroundColor: color.btn_selected
    },
});

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
	},
	btnSelected: {
		backgroundColor: color.btn_selected
	}
})

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
			fontSize: 22
		}
	})
	return(
		<View style = {style.box}>
			<Text style={style.title}> {props.title} </Text>
			<Text style={style.value}> {props.value} </Text>
		</View>
	)
}

export default addHeader(ReviewSpotCheck, 'Inventory')