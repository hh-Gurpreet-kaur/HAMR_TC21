import React from 'react'
import {
	View,
	Text,
	Button,
	StyleSheet,
	TextInput,
	TouchableNativeFeedback,
	Image,
	ScrollView,
	KeyboardAvoidingView
} from 'react-native'

import Modal from 'react-native-modal'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { translate } from '../../translations/langHelpers'
import AwesomeButton from "react-native-really-awesome-button/src/themes/cartman"

import modalStyles from '../../styles/modalStyles'

import {NativeModules} from 'react-native'
import color from '../../styles/colors'
import Settings from '../settings/settings'

import Analytics from '../../analytics/ga';

const ToastExample = NativeModules.ToastExample
const SmbModule = NativeModules.SmbModule
const Logging = NativeModules.Logging

export default class NativeData extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			name : "Press Start",
			password: "",
			username: "",
			ipAddress: "",
			isModalVisible: false,
			isSyncModalVisible: false,
			modalText: "",
			createDb: false
		}
	}

	componentDidMount() {
		Analytics.trackScreenView('First Sync');
		this.toggleModal();
	}

	componentDidUpdate() {
		
		if (this.state.createDb) {
			this.createDB()
			.then(() => {
				Settings.saveUsername(this.state.username);
				Settings.savePassword(this.state.password);
				Settings.saveIpAddress(this.state.ipAddress);
				Settings.saveLastSync();
				Logging.log("File sync complete.\n");
				this.props.navigation.navigate("App");
			})
		}
	}


	onPressCreate = () => {
		this.state.modalText = translate("syncing_files");
		this.validateFields();
	}

	syncFiles = async () => {
		let listOfFiles = [
			"ex1.tmp",
			"ex2.tmp", 
			"ex3.tmp", 
			"Keywords.txt", 
			"Images.tar", 
			"ImageLinks.db",
			"home.ini"
		];
		let success = true;
		Logging.log("Starting file sync.")
		success = await SmbModule.syncFilesFromServer(listOfFiles, this.state.ipAddress, this.state.username, this.state.password, true);

		if (success) {
			this.setState({
				createDb: true
			});
		}
		else {
			this.toggleSyncModal();
			alert(translate("sync_failed"));
		}
	}

	validateFields() {
		let error = '';
		if (this.state.ipAddress == '') {
			error = translate('enter_ip_address');
		} else if (this.state.username == '') {
			error = translate('enter_username');
		} else if (this.state.password == '') {
			error = translate('enter_password');
		} 

		if (error == '') {
			this.toggleSyncModal();
		} else {
			alert(error);
		}
	}

	createDB = async () => {
		ToastExample.createDatabase();
	}

	passwordChange = (text) => {
		this.setState({
			password: text
		})
	}

	ipAddressChange = (text) => {
		this.setState({
			ipAddress: text
		})
	}

	usernameChange = (text) => {
		this.setState({
			username: text
		})
	}

	toggleModal = () => {
	    this.setState({ isModalVisible: !this.state.isModalVisible });
	};

	toggleSyncModal = () => {
	    this.setState({ isSyncModalVisible: !this.state.isSyncModalVisible });
	}

	render() {
		return(
		<KeyboardAvoidingView style={style.container} behavior={Platform.OS === "ios" ? "padding" : null}>
			<View style={style.header}>
				<View style={style.headerIcon}>
					<Image source={require('../../assets/img/hhIcon.png')} style={style.hhIcon}/>
				</View>
				<View style={style.headerText}>
					<Text style={style.hamrText}> {translate("hamr")} </Text>
				</View>
			</View>

			<View style={{ width: "75%", alignItems: 'center'}}>
				<TextInput
					placeholder={translate('ip_address')}
					placeholderTextColor={'grey'} 
					keyboardType={'numeric'}
					onChangeText={this.ipAddressChange}
					style={style.input}
					onSubmitEditing={() => { this._username.focus(); }}
					returnKeyType="next"
					blurOnSubmit={false}
					value={this.state.ipAddress} />
				<TextInput
					ref={(input) => { this._username = input }}
					placeholder={translate('server_username')}
					placeholderTextColor={'grey'} 
					keyboardType="visible-password"
					onChangeText={this.usernameChange}
					style={style.input}
					onSubmitEditing={() => { this._password.focus(); }}
					returnKeyType="next"
					blurOnSubmit={false}
					autoCorrect={false}
					value={this.state.username} />
				<TextInput
					ref={(input) => { this._password = input }}
					placeholder={translate('server_password')}
					secureTextEntry={true}
					placeholderTextColor={'grey'} 
					onChangeText={this.passwordChange}
					style={style.input}
					onSubmitEditing={ this.onPressCreate }
					returnKeyType="go"
					value={this.state.password} />
				<AwesomeButton 
					backgroundColor={color.light_green} 
					backgroundDarker={color.light_green_darker} 
					textSize={22} width={180}
					textColor={'white'}
					borderColor={color.light_green_darker}
					onPress={this.onPressCreate}>
					<Text style={{fontSize: 22, color: "white", fontWeight: "bold"}}>{translate("sync_btn")}</Text>
				</AwesomeButton>
				
			</View>
			<View style={{flex: 1}} />	
			<Modal isVisible={this.state.isModalVisible} onBackdropPress={this.toggleModal}>
				<View  style={style.noDbModal}>

					<TouchableNativeFeedback onPress={this.toggleModal}>
						<View style={style.icon}>
							<Icon name={'alert-box-outline'} size={50} color={'black'} />
						</View>
					</TouchableNativeFeedback>
					<View style={style.modalText}>
						<Text style={style.errorText}>{translate('no_db_found')}</Text>
						<Text style={style.smallText}>{translate('sync_with_hi')}</Text>
					</View>

				</View>
			</Modal>
			<Modal isVisible={this.state.isSyncModalVisible} onModalShow={this.syncFiles} >
				<View  style={modalStyles.noDbModal}>
					<View style={modalStyles.icon} >
						<Icon name={'sync'} size={50} color={color.light_green} />
					</View>
					<View style={modalStyles.modalText}>
						<Text style={modalStyles.largeText}>{this.state.modalText}</Text>
					</View>
				</View>
			</Modal>
		</KeyboardAvoidingView>
		)
	}
}


const style = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		width: "100%",
		justifyContent: 'flex-end'
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 30
	},
	headerIcon: {
		justifyContent: 'center',
		alignItems: 'center'
	},
	hhIcon: {
		resizeMode: 'contain',
		height: 65,
		width: 65,
		marginLeft: 13
	},
	headerText: {
		justifyContent: 'center',
		alignItems: 'center'
	},
	hamrText: {
		fontFamily: 'HHAgendaBlack',
		fontSize: 60,
		color: 'black'
	},
	input: {
		borderWidth: 1,
		fontSize: 18,
		marginBottom: 15,
		width: "100%"
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
		backgroundColor: color.heading,
		paddingTop: 10,
		paddingBottom: 10,
		marginLeft: 2,
		paddingLeft: 10,
		flex: 1
	},
	errorText: {
		fontSize: 16,
		color: 'white',
		fontWeight: 'bold'
	},
	smallText: {
		color: 'white',
		fontSize: 13
	},
	icon: {
		backgroundColor: color.pink,
		justifyContent: 'center',
		alignItems: 'center',
		// borderRadius: 50,
		width: 100,
		height: 110,
		// margin: 5,
		paddingTop: 10,
		paddingBottom: 10
	},
});