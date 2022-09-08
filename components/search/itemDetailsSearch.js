import React from 'react'
import {
	View,
	Text,
	StyleSheet,
	Button,
	ScrollView,
	TouchableHighlight,
	TouchableNativeFeedback,
	TouchableOpacity,
	Image,
	TextInput,
	ActivityIndicator
} from 'react-native'

import Input from '../~handMade/rowInput'

import addHeader from '../../hoc/addHeader'
import Images from '../misc/Images'
import { translate } from '../../translations/langHelpers'
import Bluetooth from '../printing/bluetooth'
import Label from '../printing/labels'
import Modal from 'react-native-modal'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import modalStyles from '../../styles/modalStyles'
import Scanning from '../misc/scanning'

import sqldb from '../misc/database';
import color from '../../styles/colors'
import Settings from '../settings/settings'
import KeyEvent from 'react-native-keyevent'

import Analytics from '../../analytics/ga';


const KEYCODE_ENTER = 66;


class ItemDetails extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			description: '',
			mfgNum: '',
			price: '',
			retailPrice: '',
			homeRetailPrice: '',
			uom: '',
			itemNumber: '',
			section: '',
			status: '',
			qHand: '',
			qOrder: '',
			clist: '',
			grossMargin: '',
			accountingCost: '',
			unitCost: '',
			minMax: '',
			velocityCode: '',
			shelfPack: '',
			// sku array
			data: [],
			purchases: '',
			sales: '',
			cac: '',
			shipCode: '',
			base64Image: null,
			isModalVisible: false,
			isImageExpanded: false,
			update: true
		}

	}

	handleScan = (keyEvent) => {
		if (!isNaN(keyEvent.pressedKey) || keyEvent.pressedKey == "|" || keyEvent.pressedKey == "^") {
			if (keyEvent.keyCode != KEYCODE_ENTER) {
				this.currentScan += keyEvent.pressedKey;
			}
		} 


		if (keyEvent.pressedKey == "|") {
			this.state.input = this.currentScan;
			this.newScan(this.currentScan);
			this.currentScan = "";
		} else if (keyEvent.pressedKey == "^") {
			this.currentScan = "^";
			global.shouldNavigate = false;
		}
	}


	newScan = async (scan) => {
		this.setState({loading: true});

		let cleanedScan = '';
		if (scan.charAt(scan.length - 1) == '|') {
			cleanedScan = scan.substring(1, scan.length - 1);
			cleanedScan = await Scanning.checkHomeUpc(cleanedScan);
		}

		let itemNumber = cleanedScan;
		let newQuery = "";

		if (itemNumber.length == 7) {
			newQuery = this.buildQuery(itemNumber);
			this.getResults(newQuery);
		} else {
			let query = ` SELECT ItemMaster.SkuNum
				FROM ItemMaster
				LEFT JOIN Upc ON ItemMaster.SkuNum = Upc.SkuNum
				WHERE Upc.UpcCode = '${itemNumber}'
				`

				sqldb.executeReader(query).then((results) => {
					if (results.length == 0) {
						return;
					} else {
						newQuery = this.buildQuery(results.item(0).SkuNum);
						this.getResults(newQuery);
					}
				});
		}

		this.setState({
			scanText: "",
		})
	}

	buildQuery = (newItem) => {
		let q = this.props.navigation.getParam('query','aye')
		let end = q.indexOf('WHERE ItemMaster.SkuNum = ')
		let newQuery = q.slice(0, end)
		newQuery += `WHERE ItemMaster.SkuNum = ${newItem}`

		return newQuery;
	}

	// UI HANDLERS
	next = () => {
		// get index + len
		let index = this.state.data.indexOf(this.state.itemNumber.toString())
		let len = this.state.data.length

		// get new index
		let newIndex = ( index + 1 ) % len
		let newItem = this.state.data[newIndex]
		this.setState({
			itemNumber: newItem
		})

		let newQuery =this.buildQuery(newItem);

		this.getResults(newQuery)

		// log
		this.log('next done')

	}

	prev = () => {
		// get index + len
		let index = this.state.data.indexOf(this.state.itemNumber.toString())
		let len = this.state.data.length

		// get new index
		let newIndex = ( index - 1 ) % len
		// safety check
		if (newIndex < 0) {
			newIndex = 0
		}
		let newItem = this.state.data[newIndex]
		this.setState({
			itemNumber: newItem
		})

		// construct new query
		let q = this.props.navigation.getParam('query','aye')
		let end = q.indexOf('WHERE ItemMaster.SkuNum = ')
		let newQuery = q.slice(0, end)
		newQuery += `WHERE ItemMaster.SkuNum = ${newItem}`

		// let loose
		this.getResults(newQuery)


		// log
		this.log('prev done')
	}

	// kickstarter function, takes query
	start = () => {
		let q = this.props.navigation.getParam('query', '')
		let str = this.props.navigation.getParam('data',[])
		this.setState({
			data: str
		})
		if (q.length > 0 && str.length > 0) {
			this.getResults(q)
		}

	}


	getImage = async (sku) => {
		let image = await Images.getImage(sku);
		this.setState({
			base64Image: image
		})
	}

	// gets results, sends to parser
	getResults = (q) => {
		sqldb.executeReader(q).then((results) => {
			if (results.length == 0) {
				this.setState({
					loading: false
				})
				this.log('no results from ' + q)
			} else {
				this.parseResults(results)
			}
		})
	}

	// parses results
	parseResults = (results) => {
		let item = results.item(0)

		// calculate
		// cost
		let cost = item.RetailPrice > 0 ? item.RetailPrice : item.HomeRetailPrice
		// gross margin
		let gm = 0;
		
		if (global.isThirdParty) {
			gm = ( (cost - item.CurrAvgCost ) / cost ) * 100
			
		} else {
			gm = ( (cost - item.AcctCost ) / cost ) * 100
		}
		
		// min max
		let mm = `${item.Min} / ${item.Max}`
		// velocity
		let vel =  item[`ifnull(ItemMaster.Velocity,'///')`] + item[`ifnull(ItemMaster.HomeVelocity,'')`]

		let accPrice = item.AcctCost.toFixed(2)
		
		this.getImage(item.SkuNum);

		// update in screen
		this.setState({
			description: item.Description,
			mfgNum: item.MfgNum,
			price: cost,
			retailPrice: item.RetailPrice,
			homeRetailPrice: item.HomeRetailPrice,
			uom: item.RetailUnit,
			itemNumber: item.SkuNum,
			boh: item.WarehouseBOH,
			section: item.RetailLocation || '-',
			status: '',
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
			shelfPack: item.ShelfPackQty,
			purchases: item.YrPurchaseQty,
			sales: item.YrSalesQty,
			status: item.StoreItemStatus,
			homeSource: item.HomeSource,
			subSkuNum: item.SubSkuNum,
			item: item,
			loading: false,
			quantityCorrect: item.QtyCorrect == 1 ? true : false
		})

		Analytics.logViewItem(item.SkuNum, item.Description);
	}

	// gateway function to order
	toOrder = () => {
		console.log("PRESS ORDER");
		this.props.navigation.navigate('OrderScreen',{
			state: this.state
		})
	}

	// back button handler
	toResults = () => {
		this.props.navigation.goBack();
	}

	onPrint = async () => {

		let modalText = "";
		let printSuccess = true;

		this.state.modalText = translate('connecting_printer');
		this.toggleModal();

		if (Settings.labelType == "shelf") {
			printSuccess = await Label.PrintLabel("shelf", this.state.itemNumber, Settings.printerAddress);
			modalText = "shelf";
		} else {
			printSuccess = await Label.PrintLabel("upc", this.state.itemNumber, Settings.printerAddress);
			modalText = "UPC";
		}

		if (printSuccess === true) {
			this.setState({
				modalText: translate('printing_label', {labelType: modalText, itemNumber: this.state.itemNumber})
			})
			this.timedModal();
		} else {
			alert(printSuccess);
			this.toggleModal();
		}
		
	}

	onImagePress = () => {
		if (this.state.base64Image != null) {
			this.setState({ isImageExpanded: !this.state.isImageExpanded })
		}
	}

	searchLikeThis = () => {

		let query = `
		SELECT ItemMaster.SkuNum,
		ItemMaster.Description,
		ItemMaster.MfgNum,
		ItemMaster.StoreBOH,
		ItemMaster.WarehouseBOH
		FROM ItemMaster WHERE MHFineLineClassHash = (SELECT MHFineLineClassHash FROM ItemMaster WHERE SkuNum = '${this.state.itemNumber}')
		`
		
		this.props.navigation.navigate('SearchResults', { query: query });
	}

	componentDidMount() {
		this.start();

		this.focusListener = this.props.navigation.addListener("didFocus",  e => {
			this._screen.focus();
			KeyEvent.onKeyUpListener((keyEvent) => {
				this.handleScan(keyEvent);
			});
		}); 
	}

	componentWillUnmount() {
		KeyEvent.removeKeyUpListener();
		this.focusListener.remove();
	}

	componentDidUpdate(prevProps) {
		let check = prevProps.navigation.getParam('query','1') != this.props.navigation.getParam('query','2')
		if (check) {
			this.start()
		}

	}

	// `````````UTILITY + DEBUG Methods`````````

	// logger
	log = (str) => {
		let debug = false
		if (debug) {
			console.log(str)
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

	renderLoading() {
		if (this.state.loading) {
			return (
				<View style={style.loading} pointerEvents="none">
					<ActivityIndicator size='large' />
				</View>
			)
		}
		
	}

	renderImage() {
		if (this.state.base64Image != null) {
			return (
				<View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: "flex-end", width: "100%", height: "100%" }}>
					<View style={{ flexDirection: 'row', width: "90%", justifyContent: 'center' }}>
						<Image
							source={{uri: `data:image/jpg;base64,${this.state.base64Image}`}}
							style={style.img} />
					</View>
					<View style={{ width: "10%" }}>
					<Image
						source={require('../../assets/img/elastic_expansion.png')}
						style={style.img_small} />
					</View>
				</View>
			);		
		} 
		else {
			return (
				<Image
					source={require('../../assets/img/hh_grayscale.png')}
					style={style.img} />
			);	
		}
	}

	renderActive() {
		if (this.state.status == '1') {
			return (
				<View style={style.active}>
					<Text style={[style.title, {color: 'black'} ]}> {translate("active")} </Text>
				</View>
			);
		} else {
			return (
				<View style={style.inactive}>
					<Text style={[style.title, {color: 'black'} ]}> {translate("inactive")} </Text>
				</View>
			);
		}
	}

	renderOrderBtn() {
		if (global.securityLevel >= 4) {
			return (
				<TouchableNativeFeedback background={TouchableNativeFeedback.Ripple(color.btn_selected)} onPress={this.toOrder}>
					<View style={[style.btnHalf, {backgroundColor: color.light_green}]}>
						<Text style={style.btnText}> {translate("order_btn")} </Text>
					</View>
				</TouchableNativeFeedback>
			)
		}
		else {
			return (
					<View style={{width: "49%"}}>
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
			onOrderColor = 'red';
		}

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

		return(
		<View style={{flex: 1, width: "100%"}} >
			<ScrollView style={style.container}>

				<View style={{flex: 1, flexDirection: "row"}}>
					<TouchableOpacity style={style.imgBox} onPress={this.onImagePress}>
						{ this.renderImage() }
					</TouchableOpacity>
					<View style={{flex: 1}}>
						<View style={style.center}>
							<Text style={style.title}> {translate("status")}: </Text>	
							{ this.renderActive() }
						</View>
						{ global.isThirdParty &&
							<View style={style.center}> 
								<Text style={style.title}> {translate("section")}: </Text>	
								<View style={style.box}>
									<Text style={style.title}> {this.state.section} </Text>
								</View>
							</View>
						}
					</View>
					
				</View>

				<View style={{alignItems: 'center', justifyContent: 'center'}} >
					<Text style={{fontSize: 16, color: "black", width: "100%", textAlign: "center"}}>
						{this.state.description}
					</Text>
				</View>

				<View style={style.status}>
					<Text style={style.title}>{this.state.itemNumber}</Text>	
					<Text style={style.title}>{this.state.uom} / ${this.state.price}</Text>	
				</View>
				<View style={style.orderPrintPanel}>
					{ this.renderOrderBtn() }

					<TouchableNativeFeedback background={TouchableNativeFeedback.Ripple(color.btn_selected)} onPress={this.onPrint}>
						<View style={style.btnHalf}>
							<Text style={style.btnText}> {translate("print_btn")} </Text>
						</View>
					</TouchableNativeFeedback>
				</View>
				

				<View style={style.stats}>
					{ !global.isThirdParty &&
						<DualRowDisplay title={translate("boh") + ":"} value={this.state.boh} valueStyle={{color: onOrderColor}}/>
					}
					
					<DualRowDisplay title={translate("shelf_pack") + ":"} value={this.state.shelfPack} />
					<DualRowDisplay title={translate("velocity_code") + ":"} value={this.state.velocityCode} />

					{ global.canSeeCost &&
						<View>
							<DualRowDisplay title={translate("gross_margin") + ":"} value={this.state.grossMargin} />
							<DualRowDisplay title={translate("accounting_cost") + ":"} value={this.state.accountingCost} />
						</View>
					}

					{ global.isThirdParty && global.canSeeCost &&
						<DualRowDisplay title={translate("unit_cost") + ":"} value={this.state.unitCost} />
					}

					{ global.isThirdParty && 
						<DualRowDisplay title={translate("min_max") + ":"} value={this.state.minMax} />
					}

					{ global.canSeeCost && 
						<DualRowDisplay title={translate("clist") + ":"} value={this.state.clist} />
					}
					

				</View>

				
				
			</ScrollView>
			<View style={[style.orderPrintPanel]}>
				<TouchableNativeFeedback background={TouchableNativeFeedback.Ripple(color.btn_selected)} onPress={this.prev}>
					<View style={style.btn}>
						<Text style={style.btnText}> {translate("previous_btn")} </Text>
					</View>
				</TouchableNativeFeedback>

				<TouchableNativeFeedback background={TouchableNativeFeedback.Ripple(color.btn_selected)} onPress={this.next}>
					<View style={style.btn}>
						<Text style={style.btnText}> {translate("next_btn")} </Text>
					</View>
				</TouchableNativeFeedback>

				<TouchableNativeFeedback background={TouchableNativeFeedback.Ripple(color.btn_selected)} onPress={this.toResults}>
					<View style={style.btn}>
						<Text style={style.btnText}> {translate("back_btn")} </Text>
					</View>
				</TouchableNativeFeedback>
			</View>

			<Modal isVisible={this.state.isModalVisible} hasBackdrop={false} coverScreen={false} animationIn="fadeIn" animationOut="fadeOut">
				<View  style={modalStyles.noDbModal}>
					<View style={modalStyles.icon} >
						<Icon name={'printer-wireless'} size={50} color={color.light_green} />
					</View>
					<View style={modalStyles.modalText}>
						<Text style={modalStyles.smallText}>{this.state.modalText}</Text>
					</View>
				</View>
			</Modal>
			<Modal style={modalStyles.expandedImage} isVisible={this.state.isImageExpanded} on onBackdropPress={this.onImagePress} coverScreen={true} animationIn="slideInDown" animationOut="slideOutUp">
				<TouchableHighlight style={modalStyles.imgBox} underlayColor="white" onPress={this.onImagePress}>
					<Image
						source={{uri: `data:image/jpg;base64,${this.state.base64Image}`}}
						style={modalStyles.img} />
				</TouchableHighlight>
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

/*

*/


const style = StyleSheet.create({
	container: {
		width: "100%"
	},
	title: {
		fontSize: 16,
		color: 'black',
	},
	// main image
	imgBox: {
		// marginBottom: 10
		alignItems: 'center',
		justifyContent: 'center',
		height: 95,
		width: "75%",
		marginTop: 5,
		marginBottom: 5,
	},
	img: { 
		resizeMode: 'contain',
		width: 95,
		height: 95,
		marginTop: 5,
	},
	img_small: {
		resizeMode: 'contain',
		width: 20,
		height: 20,
		marginTop: 5,
	},
	box: {
		borderWidth: 1,
		borderColor: 'black',
		margin: 2
	},
	center: {
		alignItems: 'center',
		justifyContent: 'center',
		// backgroundColor: 'red'
	},
	status: {
		flexDirection: 'row',
		margin: 3,
		// backgroundColor: 'red',
		justifyContent: 'space-between',
		marginLeft: 30,
		marginRight: 30,
	},
	
	active: {
		backgroundColor: color.active,
		padding: 1,
		margin: 2
	},
	inactive: {
		backgroundColor: color.inactive,
		padding: 1,
		margin: 2
	},
	panel: {
		flexDirection: 'row'
	},
	// Button Panel
	orderPrintPanel: {
		flexDirection: 'row',
		justifyContent: 'center',
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
		alignItems: 'center',
		borderColor: 'black',
		borderWidth: 1,
		backgroundColor: 'white',
		justifyContent: 'center',
		backgroundColor: color.btn_unselected,
		height: 35,
		borderRadius: 5,
		width: "33%"
	},
	btnHalf: {
		padding: 5,
		//flex: 1,
		alignItems: 'center',
		borderColor: 'black',
		borderWidth: 1,
		backgroundColor: 'white',
		justifyContent: 'center',
		backgroundColor: color.btn_unselected,
		height: 35,
		borderRadius: 5,
		width: "49%"
	},
	btnText: {
		fontSize: 15,
		color: 'black',
		textAlign: 'center'
	},
	screenfocus: {
		position: 'absolute',
		bottom:0,
		left: 0,
		width: 0,
		height: 0,
	},
	loading: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
	  }
})


// add header + export
export default addHeader(ItemDetails, 'Item Details')

function DualRowDisplay(props) {
	const styleRow = StyleSheet.create({
		rows: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: 1,
			// backgroundColor: 'red'
			marginLeft: "5%",
			marginRight: "5%",
		},
		textTitle: {
			//marginLeft: 30
		},
		textValue: {
			//marginRight: 40,
			backgroundColor: color.light_grey,
			padding: 2,
			width: "40%"
		},
		defaultText: {
			color: 'black',
			fontSize: 14
		}
	})


	if (props.valueStyle) {
		return (
		<View style={styleRow.rows}>
			<View style={styleRow.textTitle}>
				<Text style={styleRow.defaultText}> {props.title} </Text>
			</View>
			<View style={styleRow.textValue}>
				<Text style={[styleRow.defaultText, {textAlign: 'center'}, props.valueStyle]}> {props.value} </Text>
			</View>
		</View>
		)
	} else {
		return (
		<View style={styleRow.rows}>
			<View style={styleRow.textTitle}>
				<Text style={styleRow.defaultText}> {props.title} </Text>
			</View>
			<View style={styleRow.textValue}>
				<Text style={[styleRow.defaultText, {textAlign: 'center'}]}> {props.value} </Text>
			</View>
		</View>
		)
	}
}
