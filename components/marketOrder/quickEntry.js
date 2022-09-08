import React from 'react'
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	ScrollView,
	TouchableNativeFeedback,
	CheckBox,
	Keyboard
} from 'react-native'

import {Item} from '../mainPage/home'

import AwesomeButton from "react-native-really-awesome-button/src/themes/cartman";

import addHeader from '../../hoc/addHeader'
import { translate } from '../../translations/langHelpers'
import Scanning from '../misc/scanning'
import KeyEvent from 'react-native-keyevent'
import DeleteModal from '../~handMade/deleteModal'
import EditFactor from '../misc/editFactor'

import Table from '../~handMade/threeTable'
import orderStyles from '../../styles/orderStyles'

import sqldb from '../misc/database';
import color from '../../styles/colors';
import Settings from '../settings/settings'

import Analytics from '../../analytics/ga';


class QuickEntry extends React.Component {
	currentScan = "";

	constructor(props) {
		super(props)
		this.state = {
			tableHead: [
				translate("item_no"),
				translate("qty"),
				translate("description")
			],
			tableData: [],
			quantity: '',
			placeholderText: translate('scan_barcode_or_item'),
			previousSku: '',
			scan: '',
			itemNumber: '',
			quantityCorrect: false,
			selectedLine: null,
			isDeleteModalVisible: false,
			item: null
		}
	}


	handleScan = (keyEvent) => {
		if (!isNaN(keyEvent.pressedKey) || keyEvent.pressedKey == "|" || keyEvent.pressedKey == "^") {
			if (keyEvent.keyCode != 66) {
				this.currentScan += keyEvent.pressedKey;
			}
		} 

		if (keyEvent.pressedKey == "|") {
			this.changeItemNumber(this.state.previousSku + this.currentScan);
			this.currentScan = "";
		} else if (keyEvent.pressedKey == "^") {
			this.currentScan = "^";
			global.shouldNavigate = false;
		}
	}

	componentDidMount() {
		Analytics.trackScreenView("Quick Entry");

		this.focusListener = this.props.navigation.addListener("didFocus",  e => {
			this.start();
			setTimeout(() => { this._scan.focus() }, 100);
			KeyEvent.onKeyUpListener((keyEvent) => {
				this.handleScan(keyEvent);
			});
		});

		this.start();
	}


	// ``````````````BACKEND FUNCTIONS``````````````

	start = () => {

		this.refreshResults();

		this.setState({
			scan: '',
			quantity: '',
			placeholderText: translate('scan_barcode_or_item')
		})
	}

	refreshResults = () => {
		let q = `SELECT MarketOrder.* , ifnull(Market.Description, '${translate('not_on_file')}') as Description FROM MarketOrder
		LEFT JOIN Market ON Market.SkuNum = MarketOrder.SkuNum`
		this.getResults(q);
	}


	getResults = (q) => {
		sqldb.executeReader(q).then((results) => {
			let len = results.length

			if (len > 0) {
				this.parseResults(results)
			}
		})
	}

	parseResults = (results) => {
		let len = results.length

		let ans = []
		for (var i=0; i<len; ++i) {
			let x = results.item(i)

			ans.push({
				key: x.SkuNum,
				boh: x.Qty,
				descr: x.Description,
				back: i % 2 == 0 ? color.grey : 'white'
			})
		}

		this.setState({
			tableData: ans
		})
	}

	// green row selector
	rowPress = (sku) => {
		// create new list
		let len = this.state.tableData.length

		let ans = []

		for (var i=0; i<len; ++i) {
			let x = this.state.tableData[i]
			let back = i%2 == 0 ? color.grey : 'white'

			if (x.key == sku) {
				back = color.delete_line,
				selectedLine = i;
			}

			ans.push({
				key: x.key,
				boh: x.boh,
				descr: x.descr,
				back: back
			})
		}

		this.setState({
			tableData: ans,
			selectedLine: selectedLine
		})
	}

	deleteRow = (sku) => {
		let q = `DELETE FROM MarketOrder WHERE SkuNum = ${sku}`
		sqldb.executeQuery(q);
		this.state.selectedLine = null;
	}

	updateCheck = (sku, quantity) => {
		let selected = this.state.quantityCorrect ? 1 : 0;
		let testQuery = `SELECT * FROM MarketOrder WHERE SkuNum = ${sku}`

		let qty = EditFactor.AdjustQuantity(this.state.item, quantity);
		this.state.quantity = qty.toString();

		sqldb.executeReader(testQuery).then((results) => {

			let len = results.length

			if (len == 0) {
				// new order
				this.log('potentially new sku ' + sku)

				this.addItem(sku, qty, selected)
			} else {
				// update order
				this.log('update, found in market order')

				let updateQ = `UPDATE MarketOrder SET Qty = ${qty}, Selected = ${selected} WHERE SkuNum = ${sku}`

				sqldb.executeQuery(updateQ);

			}

			// refresh (optimization needed for large sets)
			this.refreshResults();
		})
	}

	addItem = (sku, quantity, selected) => {
		if (sku.length > 0 && quantity != '') {
			let query = `INSERT INTO MarketOrder(SkuNum, Qty, Selected) VALUES(${sku}, ${quantity}, ${selected})`
	
			sqldb.executeQuery(query);
		}

	}

	getQty = (sku) => {
		let query = "SELECT MarketOrder.Qty, Market.OrderQty, MarketOrder.Selected" + 
		",ItemMaster.BuyConv" +
		",ItemMaster.EditFactor" +
		",ItemSupplier.ShelfPackQty" + 
		" from Market" + 
		" LEFT JOIN MarketOrder ON Market.SkuNum = MarketOrder.SkuNum" + 
		" LEFT JOIN ItemMaster ON Market.SkuNum = ItemMaster.SkuNum" +
		" LEFT JOIN ItemSupplier ON Market.SkuNum = ItemSupplier.SkuNum" +
		` WHERE Market.SkuNum='${sku}'`;

		sqldb.executeReader(query).then((results) => {
			let x = results.item(0);
			if (results.length == 0) {
				this.setState({
					quantity: '1',
					item: null
				})
			} else {
				let qty = '';
				let preOrderQty = Number(x.OrderQty);
				if (preOrderQty == 0) {
					qty = x.Qty == null ? '1' : x.Qty.toString();
				} else {
					qty = x.Qty == null ? preOrderQty.toString() : x.Qty.toString();
				}
				this.setState({
					quantity: qty,
					quantityCorrect: x.Selected == 1 ? true : false,
					item: x
				})
			}

		})

	}


	// ````````````````````UI HANDLERS````````````````````

	tryDelete = () => {
		if (this.state.selectedLine != null) {
			this.toggleDeleteModal();
		}
	}

	removeItem = () => {
		this.toggleDeleteModal();

		let len = this.state.tableData.length
		let ans = []
		for (var i=0; i<len; ++i) {
			let x = this.state.tableData[i]

			if (x.back != color.delete_line) {
				ans.push(x)
			} else {
				this.deleteRow(x.key)
			}
		}

		this.setState({
			tableData: ans
		})
	}

	pressAdd = () => {
		let sku = this.state.scan;

		if (sku.length > 0 && this.state.quantity != '') {
			this.updateCheck(sku, this.state.quantity)
		} 
		
	}

	changeQuantity = (q) => {
		
		if (q.includes("|")) {
			let scan = q.split("^");
			this._scan.focus();
			Keyboard.dismiss();
			this.changeItemNumber(this.state.scan + "^" + scan[1]);
		} else {
			if (!q.includes("^")) {
				this.setState({
					quantity: q.slice(0, 5)
				})
			}
			
		}
	}

	backToMarket = () => {
		this.props.navigation.goBack()
	}

	getSkuFromUpc(upc) {
		let query = `SELECT SkuNum FROM Upc WHERE UpcCode = ${upc}`;

		sqldb.executeReader(query).then((results) => {
			let x = results.item(0);
			console.log(results);
			if (results.length != 0) {
				console.log(x.SkuNum.toString())
				this.setState({
					itemNumber: x.SkuNum.toString(),
					previousSku: x.SkuNum.toString(),
					scan: x.SkuNum.toString(),
					quantityCorrect: false
				})

				this.getQty(x.SkuNum);
			}
		});
	}

	handleItem = async (sku, isScan) => {

		if (sku == this.state.previousSku) {
			// same scan
			this.setState({
				quantity: (Number(this.state.quantity) + 1).toString(),
				scan: sku
			})
		} else {
			if (isScan && this.state.previousSku != '') {
				this.updateCheck(this.state.previousSku, this.state.quantity)
			} 

			this.setState({
				scan: sku,
			})

			if (sku.indexOf('^') == -1) {
				this.setState({
					previousScan: ''
				})
				if (sku.length >= 11) {
					let upc = await Scanning.checkHomeUpc(sku);
					if (upc.length == 7) {
						this.setState({
							previousSku: upc,
							itemNumber: upc,
							scan: upc,
							quantityCorrect: false
						})
					} else {
						this.getSkuFromUpc(upc);
					}
					this.getQty(upc);
				} else {
					this.setState({
						previousSku: sku,
						itemNumber: sku,
						scan: sku,
						quantityCorrect: false
					})
	
					this.getQty(sku);
				}
			} 

		}
		
	}

	changeItemNumber = async (scan) => {
		let cleanedScan = '';
		let index = scan.indexOf('|');
		if (index != -1) {
			// pipe ('|') at end of string means barcode was scanned
			cleanedScan = scan.substring(0, index);
			cleanedScan = cleanedScan.slice(this.state.previousSku.length + 1);

			let upc = await Scanning.checkHomeUpc(cleanedScan);

			if (upc.length == 7) {
				this.handleItem(upc, true);
			}
			else if (upc.length >= 11) {
				console.log("PrevSku: " + this.state.previousScan);
				if (upc == this.state.previousScan) {
					// same scan
					this.setState({
						quantity: (Number(this.state.quantity) + 1).toString(),
						scan: this.state.itemNumber
					})
				} else {
					if (this.state.previousSku != '') {
						this.updateCheck(this.state.previousSku, this.state.quantity);
					}

					this.setState({
						previousScan: upc,
						scan: upc,
						quantityCorrect: false
					})
					
					this.getSkuFromUpc(upc);
				}
			}
		} else if (scan.length == 7 || scan.length >= 11) {
			this.handleItem(scan, false);
		} else {
			this.setState({ scan: scan });
		}
	}

	toggleDeleteModal = () => {
		this.setState({ 
			isDeleteModalVisible: !this.state.isDeleteModalVisible,
		 });
	}

	// `````````````DEBUG / UTILITY FUNCTIONS`````````````````

	log = (s) => {
		let debug = false
		if (debug) {
			console.log(s)
		}
	}

	
	render() {
		return(
		<View style={{flex: 1, width: "100%"}}>
			<View style={{ height: 360, width: "100%"}}>
				<Item
				title={translate("quick_entry_title")}
				icon={'home-city-outline'} 
				iconColor={color.btn_selected}
				back={color.light_grey}
				/>

				<View style={style.inp}>
					<TextInput 
					ref={(input) => this._scan = input}
					placeholder={this.state.placeholderText}
					keyboardType={'numeric'}
					onChangeText={this.changeItemNumber}
					value={this.state.scan}
					style={style.input}
					onFocus={this.onFocusSearch}
					onBlur={this.onBlurSearch}
					showSoftInputOnFocus={Settings.showNumpad} />
				</View>

				<View style={[orderStyles.row, orderStyles.rowCentred]}>
					<View style={[orderStyles.quantity, {width: 155 }]}>
						<Text style={orderStyles.largeText}>{translate('quantity')}: </Text>
						<TextInput
							ref={(input) => this._qty = input}
							textAlign={'center'}
							textAlignVertical={'center'}
							keyboardType={'numeric'}
							placeholder={'0'}
							selectTextOnFocus={true}
							value={this.state.quantity}
							onChangeText={this.changeQuantity}
							style={[orderStyles.qtyInput, {width: 60}]} 
							showSoftInputOnFocus={Settings.showNumpad}
						/>
					</View>

					<View style={[orderStyles.correct, {marginBottom: 0}]}>
						<CheckBox
							style={{marginHorizontal: -5}}
							value={this.state.quantityCorrect}
							onValueChange={() => this.setState({ quantityCorrect: !this.state.quantityCorrect })} />
						<Text style={{ fontSize: 13 }}> {translate("selected")} </Text>
					</View>

				</View>

				<View style={style.center}>
					<AwesomeButton 
						backgroundColor={color.light_green} 
						backgroundDarker={color.light_green_darker} 
						textSize={30} width={160} height={40}
						textColor={'white'}
						onPress={() => {this.pressAdd(this.state.itemNumber, this.state.quantity)}}
						borderColor={color.light_green_darker}>
						<Text style={{fontSize: 24, color: "white", fontWeight: "bold"}}>{translate("add")}</Text>
						</AwesomeButton>
				</View>

				<View style={style.table} >
						<View style={{ backgroundColor: color.table_header, flexDirection: "row" }}>
							<TouchableNativeFeedback>
								<View style={[rowStyle.cell, { width: 100 }]}>
									<Text style={[rowStyle.cellHeader, { fontWeight: 'bold' }]}> {this.state.tableHead[0]} </Text>
								</View>
							</TouchableNativeFeedback>

							<TouchableNativeFeedback>
								<View style={[rowStyle.cell, { width: 67, alignItems: 'center' }]}>
									<Text style={[rowStyle.cellHeader, { fontWeight: 'bold' }]}> {this.state.tableHead[1]} </Text>
								</View>
							</TouchableNativeFeedback>
							<TouchableNativeFeedback>
							<View style={[rowStyle.cell, { minWidth: 153}]}>
									<Text style={[rowStyle.cellHeader, { fontWeight: 'bold' }]}> {this.state.tableHead[2]} </Text>
								</View>
							</TouchableNativeFeedback>
						</View>
						<ScrollView horizontal={true}>
							<Table
								tableHead={this.state.tableHead}
								tableData={this.state.tableData} 
								onPressRow={this.rowPress}
								onPressHeader={() => {}}/>
						</ScrollView>
				</View>
			</View>

			<View style={style.orderPrintPanel}>
				<TouchableNativeFeedback background={TouchableNativeFeedback.Ripple(color.btn_selected)} onPress={this.tryDelete}>
					<View style={style.btn}>
						<Text style={style.btnText}> {translate("remove_item")} </Text>
					</View>
				</TouchableNativeFeedback>

				<TouchableNativeFeedback 
				background={TouchableNativeFeedback.Ripple(color.btn_selected)}
				onPress={this.backToMarket}>
					<View style={style.btn}>
						<Text style={style.btnText}> {translate("back_to_market_orders")} </Text>
					</View>
				</TouchableNativeFeedback>
			</View>
			<DeleteModal
				onDeleteRow={this.removeItem}
				prompt={translate('delete_order_prompt')}
				visible={this.state.isDeleteModalVisible}
				onHide={this.toggleDeleteModal}
			/>
		</View>

		)
	}
}

const style=StyleSheet.create({
	container: {
		// padding: 2,
		backgroundColor: 'white',
		flex: 1
	},
	center: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	input: {
		padding: 2,
		borderWidth: 1,
		borderColor: 'black',
		fontSize: 16,
		textAlign: 'center'
	},
	inputQt: {
		padding: 2,
		borderWidth: 1,
		borderColor: 'black',
		width: 120,
		marginLeft: 10,
		fontSize: 18,
		textAlign: 'center'
	},
	inp: {
		marginRight: 5,
		marginLeft: 5,
	},
	split: {
		flexDirection: 'row',
		marginBottom: 10,
		// backgroundColor: 'green'
	},
	big: {
		fontSize: 22,
		color: 'black'
	},
	addButton: {
		backgroundColor: 'green',
		borderRadius: 10,
		padding: 15,
		margin: 10,
		marginBottom: 50
	},
	table: {
		flex: 1,
		marginTop: 15
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
		width: "49%"
	},
	btnText: {
		fontSize: 16,
		color: 'black',
		textAlign: 'center'
	}
})

const rowStyle = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		width: "100%"
	},
	cell: {
		// borderWidth: 1,
		paddingTop: 2,
		paddingBottom: 2,
	},
	cellText: {
		fontSize: 18,
		color: 'black'
	},
	cellHeader: {
		fontSize: 17.5,
		color: 'black',
		paddingLeft: 5,
	}
})

export default addHeader(QuickEntry, 'Market Order')