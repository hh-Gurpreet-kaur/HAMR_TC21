import React from 'react'
import {
	View, 
	Text,
	StyleSheet,
	Button,
	TextInput,
	TouchableOpacity,
	BackHandler,
} from 'react-native'

import {Item} from '../mainPage/home'
import Input from '../~handMade/rowInput'
import AwesomeButton from "react-native-really-awesome-button/src/themes/cartman"
import ToggleSwitch from 'toggle-switch-react-native'
import { translate } from '../../translations/langHelpers'
import Modal from 'react-native-modal'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import config from '../../config';
import RNFS from 'react-native-fs'

import modalStyles from '../../styles/modalStyles'

import addHeader from '../../hoc/addHeader'

import sqldb from '../misc/database';

// Export 
import {NativeModules} from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import color from '../../styles/colors'
import Settings from '../settings/settings'

const ExportModule = NativeModules.ExportModule
const SmbModule = NativeModules.SmbModule
const ToastExample = NativeModules.ToastExample
const Logging = NativeModules.Logging


class Sync extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			password: Settings.serverPassword,
			lastSync: Settings.lastSync,
			toggle: true,
			ipAddress: Settings.ipAddress,
			server: Settings.serverUsername,
			isModalVisible: false,
			modalText: "",
			isSyncVisible: false,
			syncText: "",
			createDb: false,
			modalType: "sync",
			buttonText: "",
			storeNum: "",
			prismUsername: Settings.prismUsername,
			prismPassword: Settings.prismPassword,
			prismServer: Settings.prismServer,
			guessAccess: Settings.guestAccess
		}
	}

	componentDidMount() {
		this.getStoreNum();
	}

	componentDidUpdate() {
		
		if (this.state.createDb) {
			this.state.createDb = false;
			sqldb.closeDatabase();
			this.createDB()
			.then(() => {
				Settings.saveLastSync();
			})
		}
	}

	passwordChange = (text) => {
		this.setState({
			password: text
		})
	}

	syncTrigger = () => {
		this.toggleModal();

		if (this.state.modalType == "sync") {
			this.state.syncText = translate("sync_in_progress");
		} else if (this.state.modalType == "backup") {
			this.state.syncText = translate("backup_in_progress");
		} else if (this.state.modalType == "restore") {
			this.state.syncText = translate("restore_in_progress");
		}

		this.toggleSync();
	}

	export = async () => {
		if (this.state.modalType == "sync") {
			this.exportFiles();
		} else if (this.state.modalType == "backup") {
			this.exportBackup();
		} else if (this.state.modalType == "restore") {
			this.restoreBackup();
		}
	}

	restoreBackup = async () => {
		let success = false;
		sqldb.closeDatabase();
		Logging.log("Starting database restore.");
		
		success = await SmbModule.restoreDatabase(
			config.dbName, 
			Settings.backupFilename,
			config.backupLocation,
			this.state.ipAddress, 
			this.state.storeNum,
			this.state.server,
			this.state.password
		);

		if (success) {
			
			this.setState({
				syncText: translate("restore_complete")
			});
			Logging.log("Restore complete.\n");
		} else {
			this.toggleSync();
			alert(translate('restore_failed'));
		}
	}

	exportBackup = async () => {
		let success = false;

		Logging.log("Starting database backup.");
		success = await SmbModule.backupDatabase(
			config.dbName, 
			config.backupLocation,
			this.state.ipAddress, 
			this.state.storeNum,
			this.state.server,
			this.state.password
		);

		if (success) {
			console.log(success);
			Settings.saveBackupFilename(success);
			this.setState({
				syncText: translate("backup_complete")
			});
			Logging.log("Backup complete.\n");
		} else {
			this.toggleSync();
			alert(translate('backup_failed'));
		}
		
	}

	exportFiles = async () => {
		let listOfFiles = ["mdorder.dat", "mdmarket.dat", "mdinventory.dat"];
		let success = false;

		Logging.log("Starting file sync.");
		ExportModule.export();
		success = await SmbModule.syncFilesToServer(
			listOfFiles, 
			this.state.ipAddress, 
			this.state.server, 
			this.state.password, 
			global.isThirdParty ? this.state.prismServer : "",
			global.isThirdParty ? this.state.prismUsername : "",
			global.isThirdParty ? this.state.prismPassword : "",
			__DEV__ ? false : this.state.guessAccess
			);
		

		if (success) {
			ExportModule.archive();
			this.setState({
				syncText: translate("sync_in_progress")
			});
			this.sync();
		} else {
			this.toggleSync();
			alert(translate('sync_failed'));
		}
		
	}

	sync = async () => {
		let listOfFiles = [
			"ex1.tmp",
			"ex2.tmp", 
			"ex3.tmp", 
			"Keywords.txt",
			"home.ini"
		];


		if (this.state.toggle) {
			listOfFiles.push("ImageLinks.db");
			listOfFiles.push("Images.tar");
		}

		let success = true;
		
		success = await SmbModule.syncFilesFromServer(listOfFiles, this.state.ipAddress, this.state.server, this.state.password, false);

		if (success) {
			this.deleteData();
			this.setState({
				createDb: success != "complete",
				syncText: translate("sync_complete")
			});
			Logging.log("File sync complete.\n");
		}
		else {
			this.toggleSync();
			alert(translate("sync_failed"));
		}
		
	}

	createDB = async () => {
		ToastExample.createDatabase();
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

	deleteData = () => {
		let invDelete = "DELETE FROM InventoryCount";
		let orderDelete = "DELETE FROM [Order]";
		let marketDelete = "DELETE FROM MarketOrder";

		sqldb.executeQuery(invDelete);
		sqldb.executeQuery(orderDelete);
		sqldb.executeQuery(marketDelete);
	}

	toggleAuto = () => {
		this.setState({
			toggle: !this.state.toggle
		})
	}

	toggleGuest = () => {
		Settings.saveGuestAccess(!this.state.guessAccess);
		this.setState({
			guessAccess: !this.state.guessAccess
		})
	}

	toggleModal = (type, message, button) => {
		let modalType = type ? type : this.state.modalType;
		let modalText = message ? message : this.state.modalText
		let buttonText = button ? button : this.state.buttonText

		this.setState({ 
			isModalVisible: !this.state.isModalVisible,
			modalType: modalType,
			modalText: modalText,
			buttonText: buttonText
		 });
	}

	toggleSync = () => {
		this.setState({
			isSyncVisible: !this.state.isSyncVisible
		})
	}

	onBackdropPress = () => {
		this.toggleModal();
	}

	render() {
		return(
		<ScrollView style={{flex: 1, width: "100%"}} >
			<Item 
			title={translate("sync_title")}
			back={color.light_grey}
			icon={'folder-sync'}
			iconColor={'#f2561d'}
			/>
		<View style={style.container}>
			

			<View style={{flex: 1}}>
				<Text style={style.title}> { translate("connection_info") } </Text>
				
				<RowDisplay title={translate("last_sync_date")} value={this.state.lastSync} />

				<View style={s.dualRow}>
					<View style={s.leftAlign}>
						<Text style={s.subtitle}> {translate("allow_ip")}:  </Text>
					</View>

					<TextInput 
						value={this.state.ipAddress}
						style={s.input} 
						onChangeText={(text) => {this.setState({ipAddress: text})}}
						onEndEditing={() => { Settings.saveIpAddress(this.state.ipAddress)}}
						showSoftInputOnFocus={Settings.showNumpad}
					/>
				</View>	

				<View style={s.dualRow}>
					<View style={s.leftAlign}>
						<Text style={s.subtitle}> {translate("server_username")}: </Text>
					</View>

						<TextInput 
							value={this.state.server}
							style={s.input} 
							onChangeText={(text) => {this.setState({server: text})}}
							onEndEditing={() => { Settings.saveUsername(this.state.server)}}
						/>
				</View>	

				<View style={s.dualRow}>
					<View style={s.leftAlign}>
						<Text style={s.subtitle}> {translate("server_password")}: </Text>
					</View>

						<TextInput 
							value={this.state.password}
							style={s.input} 
							secureTextEntry={true}
							onChangeText={this.passwordChange}
							onEndEditing={() => { Settings.savePassword(this.state.password)}}
						/>
				</View>

				{ global.isThirdParty &&
					<View style={s.dualRow}>
						<View style={s.leftAlign}>
							<Text style={s.subtitle}> {translate("prism_server")}:  </Text>
						</View>

						<TextInput 
							value={this.state.prismServer}
							style={s.input} 
							onChangeText={(text) => {this.setState({prismServer: text})}}
							onEndEditing={() => { Settings.savePrismServer(this.state.prismServer)}}
						/>
					</View>	
				}
				
				{ global.isThirdParty &&
					<View style={s.dualRow}>
						<View style={s.leftAlign}>
							<Text style={s.subtitle}> {translate("prism_username")}:  </Text>
						</View>

						<TextInput 
							editable={!this.state.guessAccess}
							value={this.state.prismUsername}
							style={s.input} 
							onChangeText={(text) => {this.setState({prismUsername: text})}}
							onEndEditing={() => { Settings.savePrismUsername(this.state.prismUsername)}}
						/>
					</View>	
				}

				{ global.isThirdParty &&
					<View style={s.dualRow}>
						<View style={s.leftAlign}>
							<Text style={s.subtitle}> {translate("prism_password")}:  </Text>
						</View>

						<TextInput 
							editable={!this.state.guessAccess}
							value={this.state.prismPassword}
							style={s.input} 
							secureTextEntry={true}
							onChangeText={(text) => {this.setState({prismPassword: text})}}
							onEndEditing={() => { Settings.savePrismPassword(this.state.prismPassword)}}
						/>
					</View>	
				}

				{ global.isThirdParty &&
					<View style={s.dualRow}>
						<View style={[s.leftAlign]}>
							<Text style={s.subtitle}> {translate("enable_guest")}:  </Text>
						</View>

						<View style={[s.leftAlign, {marginLeft: 20}]}>
							<ToggleSwitch
								isOn={this.state.guessAccess}
								onColor={color.light_green}
								offColor='grey'
								size='medium'
								onToggle={this.toggleGuest}
							/>
						</View>
					</View>
				}
				
				

				<View style={s.dualRow}>
					<View style={[s.leftAlign]}>
						<Text style={s.subtitle}> {translate("sync_images")}:  </Text>
					</View>

					<View style={[s.leftAlign, {marginLeft: 20}]}>
						<ToggleSwitch
							isOn={this.state.toggle}
							onColor={color.light_green}
							offColor='grey'
							size='medium'
							onToggle={this.toggleAuto}
						/>
					</View>
				</View>

				<View style={style.dualRow}>
					<View style={style.syncBtn}>
						<AwesomeButton 
							backgroundColor={color.light_green} 
							backgroundDarker={color.light_green_darker} 
							textSize={22} width={140} height={43}
							textColor={'white'}
							borderColor={color.light_green_darker}
							onPress={() => { this.toggleModal("sync", translate("sync_warning"), translate("sync_btn")) }}>
							<Text style={{fontSize: 17, color: "white", fontWeight: "bold"}}>{translate("sync_btn")}</Text>
						</AwesomeButton>
					</View>
					<Text style={style.btnDescription} >{translate("sync_help")}</Text>
				</View>
				<View style={style.dualRow}>
					<View style={style.syncBtn}>
						<AwesomeButton 
							backgroundColor={color.light_green} 
							backgroundDarker={color.light_green_darker} 
							textSize={22} width={140} height={43}
							textColor={'white'}
							borderColor={color.light_green_darker}
							onPress={() => { this.toggleModal("backup", translate("backup_warning"), translate("backup_db")) }}>
							<Text style={{fontSize: 17, color: "white", fontWeight: "bold"}}>{translate("backup_db")}</Text>
						</AwesomeButton>
					</View>
					<Text style={style.btnDescription} >{translate("backup_help")}</Text>
				</View>
				<View style={style.dualRow}>
					<View style={style.syncBtn}>
						<AwesomeButton 
							backgroundColor={color.light_green} 
							backgroundDarker={color.light_green_darker} 
							textSize={22} width={140} height={43}
							textColor={'white'}
							borderColor={color.light_green_darker}
							onPress={() => { this.toggleModal("restore", translate("restore_warning"), translate("restore_db")) }}>
							<Text style={{fontSize: 17, color: "white", fontWeight: "bold"}}>{translate("restore_db")}</Text>
						</AwesomeButton>
					</View>
					<Text style={style.btnDescription} >{translate("restore_help")}</Text>
				</View>
			</View>
			<Modal isVisible={this.state.isModalVisible} onBackdropPress={this.onBackdropPress} >
				<View  style={style.noDbModal}>
					<View style={style.icon} >
						<Icon name={'alert-circle'} size={50} color={color.modal_red} />
					</View>
					<View style={style.modalText}>
						<Text style={style.errorText}>{translate("alert")}</Text>
						<Text style={style.smallText}>{this.state.modalText}</Text>
						<View style={{flexDirection: "row", borderTopWidth: 1, justifyContent: "space-between", width: "85%", marginTop: 10, paddingTop: 10}}>
							<TouchableOpacity style={{flexDirection: "row", alignItems: "center"}} onPress={this.syncTrigger}>
								<Icon name={'sync'} size={25} color={color.modal_red} />
								<Text style={{color: color.modal_red}}>{this.state.buttonText}</Text>
							</TouchableOpacity>
							<TouchableOpacity style={{flexDirection: "row", alignItems: "center"}} onPress={this.toggleModal}>
								<Icon name={'keyboard-backspace'} size={25} color={color.modal_green} />
								<Text style={{color: color.modal_green}}>{translate("go_back")}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
			<Modal isVisible={this.state.isSyncVisible} onModalShow={this.export} onBackdropPress={this.toggleSync}>
				<View  style={modalStyles.noDbModal}>
					<View style={modalStyles.icon} >
						<Icon name={'sync'} size={50} color={color.light_green} />
					</View>
					<View style={modalStyles.modalText}>
						<Text style={modalStyles.largeText}>{this.state.syncText}</Text>
					</View>
				</View>
			</Modal>
		</View>
		</ScrollView>
		)
	}
}


/* TEMP

this.state.ipAddress, 
this.state.server, 
this.state.password, 

*/

let s=StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 6,
		marginRight: 10,
		paddingTop: 0
	},
	cellOne: {
	},
	cellTwo: {
		
	},
	text: {
		fontSize: 16,
		color: 'black'
	},
	subtitle: {
		fontSize: 16,
		color: 'black'
	},
	dualRow: {
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		padding: 4,
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
	input: {
		borderWidth: 0.9,
		padding: 3,
		width: "45%"
	},
})

RowDisplay = (props) => {
	
	return(
		<View style={s.container}>
			<Text style={s.text}> {props.title}  </Text>
			<Text style={[{fontWeight: 'bold', fontSize: 16}]}> {props.value} </Text>
		</View>
	)
}

const style = StyleSheet.create({
	container: {
		flex: 1,
		padding: 4,
		paddingLeft: 8,
		paddingTop: 0,
		backgroundColor: 'white',
	},
	section: {
		marginBottom: 5,
		margin: 2
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		color: 'black'
		// textDecorationLine: 'underline'
	},
	icon: {
		width: 50,
		height: 50,
		backgroundColor: 'red'
	},
	subtitleView: {
		// backgroundColor: 'grey',
		marginLeft: 15
	},
	subtitle: {
		color: 'black',
		fontSize: 17
	},
	subtitleDate: {
		color: 'black',
		fontSize: 17,
		fontWeight: 'bold'
	},
	split: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginLeft: 20,
		marginRight: 20
	},
	input: {
		borderWidth: 1,
		fontSize: 18,
		marginBottom: 10,
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
		width: 65,
		height: 100,
		paddingTop: 10,
		paddingBottom: 10
	},
	syncBtn: {
		justifyContent: 'center', 
		alignItems: 'center',
		padding: 5,
		flex: 1
	},
	dualRow: {
		flexDirection: 'row',
		justifyContent: "flex-start",
		alignItems: "center",
		paddingRight: 5,
		width: "100%"
	},
	btnDescription: {
		flexWrap: 'wrap',
		color: 'black',
		paddingRight: 5,
		paddingLeft: 7,
		width: "50%"
	}
})


const newSync = addHeader(Sync, 'Settings', )
export default newSync