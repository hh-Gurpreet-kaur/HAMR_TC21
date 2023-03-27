import React from 'react'
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	Button,
	TouchableOpacity,
	ScrollView,
	Picker
} from 'react-native'

import {Item} from '../mainPage/home'

import {Dropdown} from 'react-native-material-dropdown'

import ToggleSwitch from 'toggle-switch-react-native'
import Modal from 'react-native-modal'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AwesomeButton from "react-native-really-awesome-button/src/themes/cartman";
import RNFS from 'react-native-fs'
import { translate } from '../../translations/langHelpers'

import addHeader from '../../hoc/addHeader'
import RowInput from '../~handMade/rowInput'

import sqldb from '../misc/database';
import color from '../../styles/colors'
import Settings from './settings'
import {version} from '../../package.json';
let db


class GeneralSettings extends React.Component {

	constructor(props) {
		super(props)
		

		this.state = {
			deleteList: [
				{
					label: translate("market_orders"),
					value: translate('deleted_market')
				},
				{
					label: translate("regular_orders"),
					value: translate('deleted_orders')
				},
				{
					label: translate("full_cycle_counts"),
					value: translate('deleted_full')
				},
				{
					label: translate("cycle_counts"),
					value: translate('deleted_cycle')
				},
				{
					label: translate("spot_checks"),
					value: translate('deleted_spot')
				},
			],
			toggle: Settings.timeoutEnabled,
			deleteSelected: false,
			dropdownSelected: null,
			delColor: 'grey',
			delColor2: color.heading,
			isModalVisible: false,
			isLogOffVisible: false,
			timeout: Settings.timeout,
			lastSync: Settings.lastSync,
			integrated: "No",
			version: "",
			showNumpad: Settings.showNumpad,
			storeNum: ""
		}
	}

	componentDidMount() {
		this.getIntegrated();
		this.getStoreNum();
	}

	getStoreNum() {
		let query = "SELECT SettingValue from Settings WHERE SettingName='StoreNum'";
		sqldb.executeReader(query).then((results) => {

			if (results.length == 0) {
				console.log('no results returned from ' + query)
			} else {
				let item = results.item(0)
				this.setState({
					storeNum: item.SettingValue
				})
			}

		})
	}

	saveTimeout() {
		global.updateTimeout = true;
		
		// trigger navigation refresh to reset background timer
		this.props.navigation.setParams({ update: 1 })
		Settings.saveTimeout(this.state.timeout);
	}

	getIntegrated() {
		let integrated = global.isThirdParty ? translate('yes') : translate('no');

		this.setState({integrated: integrated})
	}

	deleteFiles = () => {
		this.toggleModal();
		sqldb.executeQuery(this.getDeleteQuery());
		alert(this.state.deleteList[this.state.dropdownSelected].value);
	}

	getDeleteQuery = () => {
		let query = "";
		switch(this.state.dropdownSelected) {
			case 0:
				query = `DELETE FROM [MarketOrder]`;
				break;
			case 1:
				query = `DELETE FROM [Order]`;
				break;
			case 2:
				query = `DELETE FROM [InventoryCount] WHERE [InventoryCount].Tag IS NOT NULL AND [InventoryCount].Location IS NULL`;
				break;
			case 3:
				query = `DELETE FROM [InventoryCount] WHERE [InventoryCount].Tag IS NULL AND [InventoryCount].Location IS NOT NULL`;
				break;
			case 4:
				query = `DELETE FROM [InventoryCount] WHERE [InventoryCount].Tag IS NULL AND [InventoryCount].Location IS NULL`;
				break;
		}
		return query;
	}
	
	activateDelete = (value, index) => {
		this.setState({
			deleteSelected: true,
			dropdownSelected: index,
			delColor: color.btn_delete,
			delColor2: color.btn_delete_darker
		})
	}

	onDeletePress = () => {
		this.toggleModal();
	}

	toggleLogOff = () => {
		this.setState({ 
			isLogOffVisible: !this.state.isLogOffVisible,
		 });
	}

	logOffBackdropPress = () => {
		this.toggleLogOff();
	}

	toggleModal = () => {
		this.setState({ 
			isModalVisible: !this.state.isModalVisible,
		 });
	}

	onBackdropPress = () => {
		this.toggleModal();
	}

	tryToggleAuto = () => {
		if (this.state.toggle) {
			this.toggleLogOff();
		}
		else {
			this.toggleAuto();
		}
	}

	toggleAuto = () => {
		Settings.saveTimeoutEnabled(!this.state.toggle);
		
		this.setState({
			toggle: !this.state.toggle
		})
	}

	toggleNumpad = () => {
		Settings.saveShowNumpad(!this.state.showNumpad);

		this.setState({
			showNumpad: !this.state.showNumpad
		})
	}

	onMinPress = () => {
		if (this.state.toggle) {
			this._timeout.focus();
		}
	}

	populateDropdown() {
		let dropdownList = []
		for (let i = 0; i < this.state.deleteList.length; i++) {
			let element = {
				value: this.state.deleteList[i].label
			}
			dropdownList.push(element);
		}

		return dropdownList;
	}

	// logger
	log = (str) => {
		let debug = false
		if (debug) {
			console.log(str)
		}
	}

	render() {
		let dropdownList = this.populateDropdown();

		return(

		<View style={style.container}>
			<ScrollView>
				<Item 
				 title={translate("general_title")} 
				 icon={'cellphone-settings-variant'}
				 iconColor={'#f2561d'}
				 back={color.light_grey}
				 onPress={() => {}} />
				
				<RowDisplay title={translate("store_number")}  value={this.state.storeNum} />
				<View style={style.dualRow}>
						<View style={[style.leftAlign]}>
							<Text style={style.subtitle}> {translate("show_numpad")} </Text>
						</View>

						<ToggleSwitch
							isOn={this.state.showNumpad}
							onColor={color.light_green}
							offColor='grey'
							size='medium'
							onToggle={this.toggleNumpad}
						/>

					</View>

				<View style={style.section}>
					<Text style={style.title}> {translate("app_version")}  </Text>
					<View style={style.row}>
						<Text style={style.subtitle}> {translate("integrated")}  </Text>
						<Text style={[{fontWeight: 'bold', fontSize: 16}]}> {this.state.integrated} </Text>
					</View>
					 <View style={style.row}>
						<Text style={style.subtitle}> {translate("version")}  </Text>
						<Text style={[{fontWeight: 'bold', fontSize: 16}]}> {version} </Text>
					</View> 
					<View style={style.row}>
						<Text style={style.subtitle}> {translate("last_connected")}  </Text>
						<Text style={[{fontWeight: 'bold', fontSize: 16}]}> {Settings.lastSync} </Text>
					</View>

				</View>

				<View style={style.section}>
					<Text style={[style.title, {marginBottom: 0}]}> {translate("auto_log_off")}  </Text>

					<View style={style.dualRow}>
						<View style={[style.leftAlign]}>
							<Text style={style.subtitle}> {translate("log_user_out")} </Text>
						</View>

						<ToggleSwitch
							isOn={this.state.toggle}
							onColor={color.light_green}
							offColor='grey'
							size='medium'
							onToggle={this.tryToggleAuto}
						/>

					</View>

					<View style={style.dualRow}>
						<View style={[style.leftAlign]}>
							<Text style={style.subtitle}> {translate("log_user_out_after")}  </Text>
						</View>
						<View style={style.logoutBox}>
							<TextInput 
								ref={(input) => this._timeout = input}
								value={this.state.timeout}
								style={style.logOutSec} 
								keyboardType={'numeric'}
								maxLength={2}
								textAlign={'center'}
								selectTextOnFocus={true}
								onChangeText={(text) => {this.setState({timeout: text})}}
								onEndEditing={() => { this.saveTimeout() }}
								editable={this.state.toggle}
								showSoftInputOnFocus={Settings.showNumpad}
							/>
							<Text 
								style={{color: this.state.toggle ? 'black' : '#CFCFCF'}} 
								onPress={this.onMinPress} >
								{translate('minute_short')}
							</Text>
						</View>
					</View>	
	

				</View>


				<View style={style.section}>
					<Text style={style.title}> {translate("delete_files")}  </Text>

					<View style={style.dualRow}>
						<View style={style.leftAlignPicker}>
							<Dropdown
								data={dropdownList}
								itemCount={5}
								dropdownOffset={{top: -100, left: 0}}
								dropdownMargin={{min: 0, max: 0}}
								dropdownPosition={1}
								onChangeText={ (value, index) => { this.activateDelete(value, index) }}/>
						</View>

						<View style={{alignItems: 'center'}}>
							<AwesomeButton 
							 backgroundColor={this.state.delColor} 
							 backgroundDarker={this.state.delColor2} 
							 textSize={17} width={130} height={45}
							 textColor={'white'}
							 borderColor={'white'}
							 disabled={!this.state.deleteSelected}
							 onPress={this.onDeletePress}> 
							 <Text style={{fontSize: 16, color: "white", fontWeight: "bold"}}>{translate("delete_btn")}</Text>
							</AwesomeButton>
						</View>

					</View>	
				</View>

				<Modal isVisible={this.state.isModalVisible} onBackdropPress={this.onBackdropPress} >
					<View  style={style.noDbModal}>
						<View style={style.icon} >
							<Icon name={'alert-circle'} size={50} color={color.modal_red} />
						</View>
						<View style={style.modalText}>
							<Text style={style.errorText}>{translate("alert")}</Text>
							<Text style={style.smallText}>{translate("delete_msg")}</Text>
							<View style={{flexDirection: "row", borderTopWidth: 1, justifyContent: "space-between", width: "85%", marginTop: 10, paddingTop: 10}}>
								<TouchableOpacity style={{flexDirection: "row", alignItems: "center"}} onPress={this.deleteFiles}>
									<Icon name={'trash-can-outline'} size={25} color={color.modal_red} />
									<Text style={{color: color.modal_red}}>{translate("alert_delete_btn")}</Text>
								</TouchableOpacity>
								<TouchableOpacity style={{flexDirection: "row", alignItems: "center"}} onPress={this.toggleModal}>
									<Icon name={'keyboard-backspace'} size={25} color={'green'} />
									<Text style={{color: color.modal_green}}>{translate("go_back")}</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>

				<Modal isVisible={this.state.isLogOffVisible} onBackdropPress={this.logOffBackdropPress} >
					<View  style={style.noDbModal}>
						<View style={style.icon} >
							<Icon name={'alert-circle'} size={50} color={color.modal_red} />
						</View>
						<View style={style.modalText}>
							<Text style={style.errorText}>{translate("alert")}</Text>
							<Text style={style.smallText}>{translate("log_off_msg")}</Text>
							<View style={{flexDirection: "row", borderTopWidth: 1, justifyContent: "space-between", width: "85%", marginTop: 10, paddingTop: 10}}>
								<TouchableOpacity style={{flexDirection: "row", alignItems: "center"}} onPress={() => {this.toggleAuto(); this.toggleLogOff()}}>
									<Icon name={'check-circle'} size={25} color={color.modal_red} />
									<Text style={{color: color.modal_red}}>{translate("confirm_btn")}</Text>
								</TouchableOpacity>
								<TouchableOpacity style={{flexDirection: "row", alignItems: "center"}} onPress={this.toggleLogOff}>
									<Icon name={'keyboard-backspace'} size={25} color={'green'} />
									<Text style={{color: color.modal_green}}>{translate("go_back")}</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>
			</ScrollView>
		</View>

		)
	}
}

const style = StyleSheet.create({
	container: {
		flex: 1,
		margin: 2,
		backgroundColor: 'white',
		justifyContent: 'center',
		width: "100%",
	},
	center: {
		justifyContent: 'center',
		alignItems: 'center'
	},
	section: {
		marginBottom: 5,
		padding: 2,
		width: "100%"
	},
	title: {
		fontSize: 20,
		// textDecorationLine: 'underline',
		marginBottom: 7,
		color: 'black',
		fontWeight: 'bold'
	},
	subtitle: {
		fontSize: 16,
		color: 'black'
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 6,
		marginRight: 10,
		paddingTop: 0
	},
	dualRow: {
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		padding: 5,
		paddingLeft: 0,
		paddingRight: 20,
		width: "100%"
	},
	leftAlign: {
		flex: 1,
		padding: 2,
		justifyContent: 'flex-start',
		alignItems: 'flex-start',
		paddingLeft: 5
	},
	leftAlignPicker: {
		 width: "50%",
		 paddingLeft: 8
	},
	picker: {
		width: 200,
		height: 50,
		borderRadius: 0.9
	},
	delButton: {
		justifyContent: 'flex-start',
		alignItems: 'flex-start',
		width: "40%",
		height: 30
	},
	logOutSec: {
		paddingVertical: 0,
		width: "50%"
	},
	logoutBox: {
		flexDirection: "row",
		alignItems: 'center',
		borderWidth: 0.9,
		paddingVertical: 2,
		width: 60,
	},
	noDbModal: {
		padding: 0,
		backgroundColor: 'white',
		flexDirection: 'row',
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
		flex: 1,
	},
	errorText: {
		fontSize: 18,
		color: 'black',
	},
	smallText: {
		color: 'black',
		fontSize: 14,
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


export default addHeader(GeneralSettings, 'settings')
