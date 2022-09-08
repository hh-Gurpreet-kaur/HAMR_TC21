import React from 'React'
import {
	Text,
	View,
	StyleSheet,
	TextInput,
	CheckBox,
	ScrollView,
	TouchableNativeFeedback,
	Image,
	TouchableOpacity,
	Keyboard
} from 'react-native'

import AwesomeButton from "react-native-really-awesome-button/src/themes/cartman";

import {Item} from '../mainPage/home'
import { translate } from '../../translations/langHelpers'

import Images from '../misc/Images'
import Scanning from '../misc/scanning'
import Modal from 'react-native-modal'
import modalStyles from '../../styles/modalStyles'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import EditFactor from '../misc/editFactor'
import {DualRowDisplay} from '../search/order';

import orderStyles from '../../styles/orderStyles'
import sqldb from '../misc/database';
import Settings from '../settings/settings'
import KeyEvent from 'react-native-keyevent'

import Analytics from '../../analytics/ga';


class ItemOrdering extends React.Component {
	currentScan = "";

	constructor(props) {
		super(props)
		this.state = {
			itemNumber: '',
			quantity: '',
			selected: false,
			update: false,
			updateId: '',
			description: '',
			price: '',
			uom: 'UOM',
			cost: '',
			purchases: '',
			sales: '',
			discount: '',
			marketOrder: '',
			shelfPack: '',
			term: '',
			qHand: '',
			qOrder: '',
			booth: '',
			searchBg: color.grey,
			base64Image: null,
			isModalVisible: false,
			modalText: "",
			section: '-',
			validItem: false,
			previousSku: '',
			scan: '',
			item: null,
			isImageExpanded: false
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
		Analytics.trackScreenView("Market Order");
		this.focusListener = this.props.navigation.addListener("didFocus",  e => {
			setTimeout(() => { this._scan.focus() }, 100);
			KeyEvent.onKeyUpListener((keyEvent) => {
				this.handleScan(keyEvent);
			});
		}); 

		this.blurListener = this.props.navigation.addListener("didBlur",  e => {
			KeyEvent.removeKeyUpListener();
			this._scan.blur();
		}); 
	}

	componentWillUnmount() {
		this.focusListener.remove();
		this.blurListener.remove();
	}

	start = () => {
		let sku = this.props.navigation.getParam('sku', '');
		this.props.navigation.setParams({sku: ''});
		if (sku != '') {
			let itemNumber = sku.toString();
			this.setState({
				scan: itemNumber,
				itemNumber: itemNumber,
				previousSku: itemNumber,
			})
			this.findBySku(sku)
		}
	}

	// BACKEND
	initData = () => {
		this.findBySku(this.state.itemNumber)
	}

	getSearchQuery = () => {
		let q = "SELECT" +
        " Market.SkuNum" +
        ",Market.Description" +
        ",Market.Cost" +
        ",Market.RetailPrice" +
        ",ifnull(ItemMaster.HomeRetailPrice,0)" +
        ",ItemMaster.StoreBOH" +
        ",ItemMaster.YrPurchaseQty" +
		",ItemMaster.YrSalesQty" +
		",ItemMaster.EditFactor" +
		",ItemMaster.BuyConv" +
		",ifnull(ItemMaster.StoreItemStatus,0) as StoreItemStatus" +
		",ifnull(ItemMaster.WarehouseBOH,0)";


        q += ",ifnull(ItemMaster.HHShipCode,0)" +
            ",ifnull(ItemSupplier.SalesCode,0)" +
            ",ifnull(ItemSupplier.ShelfPackQty,0)" +
            ",ItemSupplier.ShelfPackQty" +
			",ItemMaster.OnOrderQty" +
			",ifnull(ItemMaster.RetailLocation,'-') as RetailLocation" + 
            ",Market.FormatFlag" +
            ",Market.Booth" +
            ",Market.DealNum" +
            ",Market.Discount" +
            ",Market.RetailUnit" +
            ",Market.TermsWeek" +
            ",Market.OnChecklistQty" +
            ",Market.LastMktQty" +
            ",Market.OrderQty" +
            ",Market.InitialSelected" +
            ",MarketOrder.Qty" +
            ",MarketOrder.Selected" + 
            " FROM Market" +
            " LEFT JOIN ItemSupplier ON Market.SkuNum = ItemSupplier.SkuNum" +
            " LEFT JOIN ItemMaster ON Market.SkuNum = ItemMaster.SkuNum" +
            " LEFT JOIN MarketOrder ON Market.SkuNum = MarketOrder.SkuNum";
			
			return q;
			
	}

	// integrated vs standalone difference
	findBySku = (sku) => {
		let query = this.getSearchQuery();
		query += ` WHERE Market.SkuNum = '${sku}'`;
	         
	    this.getResults(query);
	}

	findByUpc = (upc) => {
		let query = this.getSearchQuery();
		query += ` LEFT JOIN Upc ON Market.SkuNum = Upc.SkuNum WHERE Upc.UpcCode = '${upc}'`;
	         
	    this.getResults(query);
	}

	getImage = async (sku) => {
		let image = await Images.getImage(sku);
		this.setState({
			base64Image: image
		})
	}

	getResults = (q) => {
		sqldb.executeReader(q).then((results) => {
			if (results.length == 0) {
				// red box, not found 404 :(((
				this.clearItem();
			} else {
				this.parseResults(results)
			}
		})
	}

	parseResults = (results) => {
		let len = results.length
		let x = results.item(0)

		this.getImage(x.SkuNum)
		let shouldUpdate = x.Qty == null ? false : true;
		let preOrderQty = Number(x.OrderQty);
		let qty = '';
		if (preOrderQty == 0) {
			qty = x.Qty == null ? '' : x.Qty.toString();
		} else {
			qty = x.Qty == null ? preOrderQty.toString() : x.Qty.toString();
		}
		this.setState({
			itemNumber: x.SkuNum.toString(),
			previousSku: x.SkuNum.toString(),
			scan:  x.SkuNum.toString(),
			description: x.Description,
			price: x.RetailPrice.toFixed(2),
			uom: x.RetailUnit,
			section: x.RetailLocation || '-',
			cost: x.Cost,
			purchases: x.YrPurchaseQty,
			sales: x.YrSalesQty,
			discount: x.Discount + '%',
			marketOrder: x.LastMktQty,
			shelfPack: x.ShelfPackQty, 
			term: x.TermsWeek,
			qHand: x.StoreBOH || 0, 
			qOrder: x.OrderQty,
			searchBg: color.light_grey,
			quantity: qty,
			selected: x.Selected == 1 ? true : false,
			status: x.StoreItemStatus,
			booth: x.Booth.trim(),
			update: shouldUpdate,
			validItem: true,
			item: x
		})
	}

	clearItem = () => {
		this.setState({
			description: translate('not_on_file'),
			price: '',
			uom: 'UOM',
			section: '-',
			cost: '',
			purchases: '',
			sales: '',
			discount: '',
			marketOrder: '',
			shelfPack: '', 
			term: '',
			qHand: '', 
			qOrder: '',
			booth: '',
			searchBg: '#ff8c8c',
			quantity: '',
			selected: false,
			status: '',
			update: false,
			base64Image: null,
			validItem: false,
			item: null
		})
	}

	placeOrder = () => {
		// called from = _pressOrder()
		let select = this.state.selected ? 1 : 0
		let sku = this.state.itemNumber
		let q = ''

		let qty = EditFactor.AdjustQuantity(this.state.item, this.state.quantity);
		this.state.quantity = qty.toString();

		console.log("ORDERING...");
		let checkUpdate = `SELECT * FROM MarketOrder WHERE SkuNum='${this.state.itemNumber}'`;
		sqldb.executeReader(checkUpdate).then((results) => {
			if (results.length > 0) {
				// update order
				this.log('order being updated with sku ' + sku)
				let id = this.state.updateId
				q = `UPDATE MarketOrder SET Qty = ${qty}, Selected = ${select} WHERE SkuNum = ${sku}`
				this.state.modalText = `Quantity changed for (${sku}) to ${qty}`;
			} else {
				// new order
				this.log('new order placed')
				q = `INSERT INTO MarketOrder (SkuNum, Qty, Selected) VALUES (${sku}, ${qty},${select} )`
				this.state.modalText = `New market order placed for ${qty} x (${sku})`;
				// flag for update
				this.setState({
					update: true
				})
			}
	
			sqldb.executeQuery(q);
			this.timedModal();
		})
		
	}




	// `````````UI HANDLERS`````````

	handleItem = async (sku, isScan) => {
		console.log('SKU: ' + sku);
		this.setState({
			scan: sku,
			bg: 'white',
			barcodeBg: 'white',
		})

		//if (sku.length == 7) {
			if (sku == this.state.previousSku) {
				// same scan
				this.setState({
					quantity: (Number(this.state.quantity) + 1).toString()
				})
			} else {
				if (isScan && this.state.previousSku != '') {
					this.addToOrder(this.state.previousSku)
				} 

				if (sku.indexOf('^') != -1) {
					this.setState({
						scan: sku
					})
				} else {
					this.setState({
						itemNumber: sku,
						previousScan: sku,
						previousSku: sku
					})
					
					if (sku.length >= 11) {
						let upc = await Scanning.checkHomeUpc(sku);
						if (upc.length == 7) {
							this.findBySku(upc);
						} else {
							this.findByUpc(upc);
						}
					} else {
						this.findBySku(sku)
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
				if (upc == this.state.previousScan) {
					// same scan
					this.setState({
						quantity: (Number(this.state.quantity) + 1).toString(),
						scan: this.state.previousSku
					})
				} else {
					if (this.state.previousSku != '') {
						this.addToOrder(this.state.previousSku);
					}

					this.setState({
						scan: upc,
						previousScan: upc,
						previousSku: upc
					})
					
					this.findByUpc(upc);
				}
			}
		} else if (scan.length == 7 || scan.length >= 11) {
			this.handleItem(scan, false);
		} else if (scan.length == 0) {
			this.setState({
				scan: scan,
				previousSku: scan
			})
		} else {
			this.setState({ scan: scan });
		}
	}


	changeCorrect = () => {
		this.setState({
			selected: !this.state.selected
		})
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

	onImagePress = () => {
		if (this.state.base64Image != null) {
			this.setState({ isImageExpanded: !this.state.isImageExpanded })
		}
	}

	// order button
	addToOrder = (sku) => {
		// check for update
		console.log("Adding: " + sku);

		if (sku.length > 0 && this.state.quantity != '') {
			this.placeOrder()
		}	
	}

	toOrderReview = () => {
		this.props.navigation.navigate('ReviewMarketOrder', {
			seed: Math.random()
		})
	}

	// ````````UTILITY FUNCTIONS````````

	log = (style) => {
		let debug = true
		if (debug) {
			console.log(style)
		}
	}

	toggleModal = () => {
		this.setState({ 
			isModalVisible: !this.state.isModalVisible,
		 });
	}

	timedModal = () => {
		if(!this.state.isModalVisible) {
			this.toggleModal()
			setTimeout(this.toggleModal, 3000)
		}
	}

	renderImage() {
		if (this.state.base64Image != null) {
			return (
				<View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: "flex-end", width: "100%", height: "100%" }}>
					<View style={{ flexDirection: 'row', width: "90%", justifyContent: 'center' }}>
						<Image
							source={{uri: `data:image/jpg;base64,${this.state.base64Image}`}}
							style={orderStyles.img} />
					</View>
					<View style={{ width: "10%" }}>
					<Image
						source={require('../../assets/img/elastic_expansion.png')}
						style={orderStyles.img_small} />
					</View>
				</View>
			);		
		} 
		else {
			return (
				<Image
					source={require('../../assets/img/hh_grayscale.png')}
					style={orderStyles.img} />
			);	
		}
	}

	renderActive() {
		if (this.state.status == '1') {
			return (
				<View style={orderStyles.active}>
					<Text style={[orderStyles.title, {color: 'black'} ]}> {translate("active")} </Text>
				</View>
			);
		} else {
			return (
				<View style={orderStyles.inactive}>
					<Text style={[orderStyles.title, {color: 'black'} ]}> {translate("inactive")} </Text>
				</View>
			);
		}
	}

	renderTop() {
		let descColor = 'black';
		if (this.state.homeSource == "S") {
			descColor = "green";
		}
		if (this.state.shipCode == 13 || this.state.shipCode == 15) {
			descColor = "peru";		// brown
		}
		if (this.state.subSkuNum != 0 && this.state.subSkuNum != '') {
			descColor = "purple";
		}

		if (this.state.validItem) {
			return (
				<View style={{width: "100%"}}>
					<View style={{flex: 1, flexDirection: "row"}}>
						<TouchableOpacity style={orderStyles.imgBox} onPress={this.onImagePress}>
							{ this.renderImage() }
						</TouchableOpacity>
						<View style={{flex: 1}}>
							<View style={orderStyles.center}>
								<Text style={orderStyles.title}> {translate("status")}: </Text>	
								{ this.renderActive() }
							</View>
							{ global.isThirdParty &&
								<View style={orderStyles.center}> 
									<Text style={orderStyles.title}> {translate("section")}: </Text>	
									<View style={orderStyles.box}>
										<Text style={orderStyles.title}> {this.state.section} </Text>
									</View>
								</View>
							}
						</View>
						
					</View>

					<View style={{alignItems: 'center', justifyContent: 'center'}} >
						<Text style={orderStyles.description}>
							{this.state.description}
						</Text>
					</View>
				</View>
			)
		}
	}

	render() {
		let onHandColor = 'black';
		if (this.state.qHand > 0) {
			onHandColor = 'green';
		} else if (this.state.qHand < 0) {
			onHandColor = 'red';
		}

		let onOrderColor = 'black';
		if (this.state.qOrder > 0) {
			onOrderColor = 'green';
		} else if (this.state.qOrder < 0) {
			onHaonOrderColordColor = 'red';
		}

		return(
			<View style={{flex: 1, width: "100%"}}>
				<View style={{ height: 364, width: "100%"}}>
					<ScrollView style={orderStyles.container} keyboardShouldPersistTaps={'handled'}>

						{this.renderTop()}

						<View style={orderStyles.status}>
							<TextInput
								ref={(input) => this._scan = input }
								placeholder={translate("scan_or_enter")}
								placeholderTextColor='red'
								keyboardType="numeric"
								value={this.state.scan} 
								style={[orderStyles.itemInput, {backgroundColor: this.state.bg}]}
								onChangeText={this.changeItemNumber}
								autoFocus={true}
								showSoftInputOnFocus={Settings.showNumpad}/>
							
						</View>

						<View style={orderStyles.row}>
							<View style={orderStyles.quantity}>
								<Text style={orderStyles.largeText}>{translate('qty_caps')}: </Text>
								<TextInput
									ref={(input) => this._qty = input}
									textAlign={'center'}
									textAlignVertical={'center'}
									keyboardType={'numeric'}
									placeholder={'0'}
									selectTextOnFocus={true}
									value={this.state.quantity}
									onChangeText={this.changeQuantity}
									style={[orderStyles.qtyInput, { backgroundColor: this.state.quantityBg}]} 
									showSoftInputOnFocus={Settings.showNumpad}
								/>
							</View>

							<Text style={orderStyles.title}>{this.state.uom} / ${this.state.price}</Text>	

							<View style={[orderStyles.correct, {marginBottom: 0}]}>
								<CheckBox
									style={{marginHorizontal: -5}}
									value={this.state.selected}
									onValueChange={() => this.setState({ selected: !this.state.selected })} />
								<Text style={{ fontSize: 13 }}> {translate("selected")} </Text>
							</View>

						</View>

						<View style={orderStyles.twoColumn}>
							<View style={orderStyles.largeColumn}>
								
								{ global.canSeeCost && 
									<DualRowDisplay title={translate("cost") + ":"} value={this.state.cost} />
								}
								<DualRowDisplay title={translate("last_market_order") +  ":"} value={this.state.marketOrder} />
								<DualRowDisplay title={translate("term") + ":"} value={this.state.term} />
								<DualRowDisplay title={translate("booth") + ":"} value={this.state.booth} />

								{ global.isThirdParty && 
									<DualRowDisplay title={translate("twelve_month_purch") + ":"} value={this.state.purchases} />
								}
							</View>

							<View style={orderStyles.smallColumn}>
								{ global.isThirdParty && 
									<DualRowDisplay title={translate("qty_on_hand") + ":"} value={this.state.qHand} valueStyle={{color: onHandColor}}/>
								}
								{ global.isThirdParty
									?
									<DualRowDisplay title={translate("qty_on_order") + ":"} value={this.state.qOrder} valueStyle={{color: onOrderColor}}/>
									:
									<DualRowDisplay title={translate("boh") + ":"} value={this.state.boh} valueStyle={{color: onOrderColor}}/>
								}

								<DualRowDisplay title={translate("discount") + ":"} value={this.state.discount} />
								<DualRowDisplay title={translate("shelf_pack") + ":"} value={this.state.shelfPack} />

								{ global.isThirdParty && 
									<DualRowDisplay title={translate("twelve_month_sales") + ":"} value={this.state.sales} />
								}
							</View>
						</View>


					<View style={{paddingLeft: 5}}>
						<AwesomeButton 
							backgroundColor={color.pink} 
							backgroundDarker={color.pink_darker} 
							textSize={22} width={310} height={42}
							textColor={'white'}
							borderColor={color.pink_darker}
							onPress={() => {this.addToOrder(this.state.itemNumber)}}> 
							<Text style={orderStyles.orderBtnText}>{translate("order_btn")}</Text>
						</AwesomeButton>
					</View>
				
				</ScrollView>
				</View>
				<View style={style.orderPrintPanel}>
					<TouchableNativeFeedback 
						background={TouchableNativeFeedback.Ripple(color.btn_selected)}
					>
						<View style={[style.btn, style.btnSelected]}>
							<Text style={style.btnText}> {translate("item_details_tab")}</Text>
						</View>
					</TouchableNativeFeedback>

					<TouchableNativeFeedback 
						background={TouchableNativeFeedback.Ripple(color.btn_selected)}
						onPress={this.toOrderReview}>
						<View style={style.btn}>
							<Text style={style.btnText}> {translate("order_review_tab")} </Text>
						</View>
					</TouchableNativeFeedback>

					<TouchableNativeFeedback 
						background={TouchableNativeFeedback.Ripple(color.btn_selected)}
						onPress={() => this.props.navigation.navigate('OrderInfo', {sku: this.state.itemNumber})}>
						<View style={style.btn}>
							<Text style={style.btnText}> {translate("order_info_tab")} </Text>
						</View>
					</TouchableNativeFeedback>
					
				</View>
				<Modal isVisible={this.state.isModalVisible} hasBackdrop={false} coverScreen={false} animationIn="fadeIn" animationOut="fadeOut">
					<View  style={modalStyles.noDbModal}>
						<View style={modalStyles.icon} >
							<Icon name={'check-circle'} size={50} color={color.light_green} />
						</View>
						<View style={modalStyles.modalText}>
							<Text style={modalStyles.smallText}>{this.state.modalText}</Text>
						</View>
					</View>
				</Modal>
				<Modal style={modalStyles.expandedImage} isVisible={this.state.isImageExpanded} onBackdropPress={this.onImagePress} hasBackdrop={true} coverScreen={true} animationIn="slideInDown" animationOut="slideOutUp">
					<View style={modalStyles.imgBox}>
						<Image
							source={{uri: `data:image/jpg;base64,${this.state.base64Image}`}}
							style={modalStyles.img} />
					</View>
				</Modal>
			</View>
			
		)	
	}
}

const style = StyleSheet.create({
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
		height: 45,
		borderRadius: 5,
		width: "33%"
	},
	btnText: {
		fontSize: 15,
		color: 'black',
		textAlign: 'center'
	},
	btnSelected: {
		backgroundColor: color.btn_selected
	}
});

// ADD HEADER + EXPORT
import addHeader from '../../hoc/addHeader'
import color from '../../styles/colors';
export default addHeader(ItemOrdering, 'Market Order')