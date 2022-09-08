import React from 'react';
import { 
	Text,
	View,
	ScrollView,
	TouchableNativeFeedback,
	TextInput
} from 'react-native';

import Modal from 'react-native-modal'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import {Item} from '../mainPage/home'
import MainCount from "./countComponent";
import modalStyles from '../../styles/modalStyles'
import Label from '../printing/labels'
import { translate } from '../../translations/langHelpers'
import {Dropdown} from 'react-native-material-dropdown'
import invStyle from '../../styles/inventoryStyles'
import AlphabetPicker from '../~handMade/alphabetPicker'

import addHeader from '../../hoc/addHeader'

import sqldb from '../misc/database';
import color from '../../styles/colors';
import Settings from '../settings/settings';
import KeyEvent from 'react-native-keyevent'

import Analytics from '../../analytics/ga';
import { TouchableOpacity } from 'react-native-gesture-handler';


class MainCycleCount extends React.Component {

	static navigationOptions = {
		header: null
	}

	modalSku = '';
	modalDesc = '';
	modalQuantity = '';

	constructor(props) {
		super(props) 
		this.state = {
			selectedSection: '',
			isModalVisible: false,
			isPrintModalVisible: false,
			modalText: "",
			sectionList: [],
			visible: false,
			picked: null
		}
	}

	componentDidMount() {
		Analytics.trackScreenView("cycle Count");
		this.dbCheck()
	}

	// BACKEND

	getStoreSections = () => {
		let query = `SELECT ItemLocationID, RetailLocation from ItemLocation`;

		sqldb.executeReader(query).then((results) => {
			let len = results.length
			let data = [];

			for (var i=0; i<len; ++i) {
				let x = results.item(i);
				data.push({
					id: x.ItemLocationID,
					name: x.RetailLocation.toString()
				})
			}

			this.setState({
				sectionList : data,
				dataLength: len
			})
		})

	}

	dbCheck = () => {
		this.getStoreSections();
	}


	addBySku = (sku, quantity, description) => {
		let startDate = this.getCurrDate();
		let query = "";

		query = `INSERT INTO [InventoryCount](SkuNum,Qty,EmployeeID,Location,StartDate)
		VALUES (${sku},${quantity.toString()},${global.employeeId},'${this.state.selectedSection}','${startDate}')`;
		
		this.addInventory(query, sku, quantity, description);
	}

	addByUpc = (upc, quantity, description) => {
		let startDate = this.getCurrDate();
		let query = "";

		query = `INSERT INTO [InventoryCount](UpcCode,Qty,EmployeeID,Location,StartDate)
			VALUES (${upc},${quantity.toString()},${global.employeeId},'${this.state.selectedSection}','${startDate}')`;

			this.addInventory(query, upc, quantity, description);
	}

	addInventory = (query, sku, quantity, description) => {
		if (Number(quantity) > 0) {
			this.modalSku = sku;
			if (this.modalSku != '')
				this.modalSku += ' - '
			this.modalDesc = description;
			this.modalQuantity = quantity;

			sqldb.executeQuery(query);
			this.timedModal();
		}
	}

	getCurrDate = () => {
		let year = new Date().getFullYear();
		let month = new Date().getMonth() + 1;
		let day = ('0' + new Date().getDate()).slice(-2);

		return year + '-' + month + '-' + day;
	}

	pressPrint = async (sku) => {
		let modalText = "";
		let printSuccess = true;

		if (sku != '') {
			this.state.modalText = translate('connecting_printer');
			this.togglePrintModal();

			if (Settings.labelType == "shelf") {
				printSuccess = await Label.PrintLabel("shelf", sku, Settings.printerAddress);
				modalText = "shelf";
			} else {
				printSuccess = await Label.PrintLabel("upc", sku, Settings.printerAddress);
				modalText = "UPC";
			}

			if (printSuccess === true) {
				this.setState({
					modalText: translate('printing_label', {labelType: modalText, itemNumber: sku})
				})
				this.timedPrintModal();
			} else {
				alert(printSuccess);
				this.togglePrintModal();
			}
		}
	}

	changeSection = (value) => {
		this.setState({
			selectedSection: value,
		});

	}

	// HELPERS

	log = (s) => {
		let debug = true
		if (debug) {
			console.log(s)
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

	togglePrintModal = () => {
		this.setState({ 
			isPrintModalVisible: !this.state.isPrintModalVisible,
		 });
	}

	timedPrintModal = () => {
		setTimeout(this.togglePrintModal, 4000)
	}

	onSelect = (selected) => {
		this.setState({
		  selectedSection: selected.name,
		  visible: false
		})
	}

	onCancel = () => {
		this.setState({
			visible: false 
		});
	}

	renderSection() {
		if (this.state.selectedSection == ''){
			return (
			<View style={{width: "95%", alignItems: 'center'}}>
					<Text style={invStyle.headingCenter}>{translate('select_section')}:</Text>
					<View style={{width: "100%", paddingLeft: "5%"}}>
						<TouchableOpacity style={{ width: "100%" }} onPress={() => { this.setState({ visible: true })}}>
							<Dropdown
								data={undefined}
								value={this.state.selectedSection}
								labelPadding={0}
								labelHeight={0}
								/>
						</TouchableOpacity>
					</View>
			</View>
			)
		} else {
			return(
			<View style={invStyle.dualRow}>
				<Text style={invStyle.title}>{translate('section_caps')}:</Text>
				<View style={{width: 145, marginLeft: 10}}>
					<TouchableOpacity onPress={() => { this.setState({ visible: true })}}>
						<Dropdown
							data={undefined}
							value={this.state.selectedSection}
							labelHeight={0}
							labelPadding={0}
							/>
					</TouchableOpacity>
				</View>
			</View>
			)
		}
	}

	renderItemInfo() {
		if (this.state.selectedSection != '') {
			return (
				<MainCount 
					addBySku={this.addBySku}
					addByUpc={this.addByUpc}
					pressPrint={this.pressPrint}
					section={this.state.selectedSection}
					navigation={this.props.navigation}
				/>
			)
			
		} else {
			return (
				<TextInput 
					style={{ width: 0, height: 0, padding: 0, margin: 0 }}
					showSoftInputOnFocus={false}
					autoFocus={true}
				/>
			)
		}
	}

	render() {

		return(
			<View style={{flex: 1, width: "100%"}}>
				<View style={{ height: 377, width: "100%"}}>
					<ScrollView style={invStyle.container} keyboardShouldPersistTaps={'handled'} >
						<Item
							title={translate('cycle_count_title')}
							back={color.light_grey}
							icon={'box'}
							iconLib={'Feather'}
							iconColor={color.heading} />
						
						{ this.renderSection() }

						{ this.renderItemInfo() }

					</ScrollView>
				</View>
				<View style={[invStyle.orderPrintPanel]}>
					<TouchableNativeFeedback 
					background={TouchableNativeFeedback.Ripple(color.btn_selected)}>
						<View style={[invStyle.btn, invStyle.btnSelected]}>
							<Text style={invStyle.btnText}>{ translate('cycle_count_tab') }</Text>
						</View>
					</TouchableNativeFeedback>

					<TouchableNativeFeedback 
					background={TouchableNativeFeedback.Ripple(color.btn_selected)}
						onPress={() => this.props.navigation.navigate('ReviewCycleCount')}>
						<View style={[invStyle.btn]}>
							<Text style={invStyle.btnText}>{translate('review_inventory_tab')}</Text>
						</View>
					</TouchableNativeFeedback>
				</View>
				<Modal isVisible={this.state.isModalVisible} hasBackdrop={false} coverScreen={false} animationIn="fadeIn" animationOut="fadeOut">
					<View  style={invStyle.noDbModal}>
						<View style={invStyle.icon} >
							<Icon name={'check-circle'} size={50} color={color.light_green} />
						</View>
						<View style={invStyle.modalText}>
							<Text style={invStyle.smallText}>{this.modalSku}{this.modalDesc}</Text>
							<Text style={invStyle.smallText}> {translate('counted_qty')} {this.modalQuantity}  </Text>
						</View>
					</View>
				</Modal>
				<Modal isVisible={this.state.isPrintModalVisible} hasBackdrop={false} coverScreen={false} animationIn="fadeIn" animationOut="fadeOut">
					<View  style={modalStyles.noDbModal}>
						<View style={modalStyles.icon} >
							<Icon name={'printer-wireless'} size={50} color={color.light_green} />
						</View>
						<View style={modalStyles.modalText}>
							<Text style={modalStyles.smallText}>{this.state.modalText}</Text>
						</View>
					</View>
				</Modal>
				<AlphabetPicker 
					visible={this.state.visible}
					onRequestClose={this.onCancel}
					data={this.state.sectionList}
					onSelect={this.onSelect}
					placeholder={translate('filter_section')}
				/>
			</View>
		)
	}
}


export default addHeader(MainCycleCount, 'Inventory')
