import React from 'react'
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	CheckBox,
	TouchableNativeFeedback,
	Image,
	ImageBackground,
} from 'react-native'

import { translate } from '../../translations/langHelpers'

// UI libaries
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AwesomeButton from "react-native-really-awesome-button/src/themes/cartman"

// SQL library + db constants
import sqldb from '../misc/database';
import color from '../../styles/colors'
import Settings from '../settings/settings'

import Analytics from '../../analytics/ga';
import config from '../../config'


export default class userLoginScreen extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			username: Settings.username,
			password: config.easyAccess ? Settings.password: '',
			usernameError: false,
			passwordError: false,
			rememberToggle: Settings.rememberMe
		}

		// bind non-react functions
		this.usernameChange = this.usernameChange.bind(this)
		this.passwordChange = this.passwordChange.bind(this)
		this.tryLogin = this.tryLogin.bind(this)
	}

	componentDidMount() {
		Analytics.trackScreenView('Login');
	}

	setSecurityLevel(secLevel) {
		let permissions = secLevel.split(',');

		permissions.forEach(permission => {
			let level = global.securityLevel;
			console.log(permission);
			switch (permission.toUpperCase().trim()) {
				case "M01":
				case "INQ":
					if (level < 1) global.securityLevel = 1;
					break;
				case "M02":
				case "RCV":
					if (level < 2) global.securityLevel = 2;
					break;
				case "M03":
				case "CIN":
					if (level < 3) global.securityLevel = 3;
					break;
				case "M04":
				case "ORD":
					if (level < 4) global.securityLevel = 4;
					break;
				case "M05":
				case "MGR":
					if (level < 5) global.securityLevel = 5;
					break;
				case "M50":
					global.canSeeCost = true;
					break;
				default:
					if (level < 1) global.securityLevel = 1
					break;
			}
		});

	}

	getIntegrated() {
		if (config.debugIntegrated) {
			global.isThirdParty = true;
		} else {
			let query = `SELECT SettingValue FROM Settings WHERE SettingName='IsThirdParty'`;

			sqldb.executeReader(query).then((results) => {
				if (results.length > 0 && results.item(0).SettingValue == "no") {
					global.isThirdParty = false
				} else {
					global.isThirdParty = true;
				}
			});
		}

		Settings.saveIntegrated(global.isThirdParty);
		
	}

	toggleRemember = () => {
		this.setState({
			rememberToggle: !this.state.rememberToggle
		})
	}


	// main login function
	async tryLogin() {
		// get from state
		let user = this.state.username
		let pass = this.state.password

		// VALIDATE : should be string, and non null
		let oneTest = typeof user === 'string' && typeof pass === 'string'
		oneTest = oneTest && user.length > 0 && pass.length > 0
		if (oneTest) {
			let query = ` SELECT * FROM Employee WHERE Employee.Login = '${user}' `;
			// get transaction object
			sqldb.executeReader(query).then((results) => {
				var len = results.length;

				// no row returned
				if (len == 0) {
					this.setState({
						usernameError: true,
						passwordError: false
					})
					return
				}

				var row = results.item(0);
				var dbPass = row.Password;

				// LOGIN : row returned, password is correct
				if (len == 1 && dbPass == pass) {
					this.setState({
						usernameError: false,
						passwordError: false,
						username: this.state.rememberToggle || config.easyAccess ? user: '',
						password: config.easyAccess ? pass : ''
					})

					global.canSeeCost = false;
					global.securityLevel = 0;
					this.setSecurityLevel(row.Class);
					global.employeeId = row.EmployeeID.toString();
					Settings.saveUserCreds(this.state.rememberToggle, user, pass);
					this.getIntegrated();
					this.props.navigation.navigate('Router',{
						user: user
					})
				} 
				// Row returned but password aint matching
				else {
					this.setState({
						usernameError: false,
						passwordError: true
					})
				}
			})
			
			
		}
	}

	// field event handlers
	usernameChange(text) {
		this.setState({
			username: text
		})
	}
	passwordChange(text) {
		this.setState({
			password: text
		})
	}

	renderUserError = () => {
		if (this.state.usernameError) {
			return (
				<View style={style.passwordError}>	
					<Text style={style.errorText}>
						{ translate('username_wrong') }
					</Text> 
				</View>
			)
		}
	}

	renderPasswordError = () => {
		if (this.state.passwordError) {
			return (
				<View style={style.passwordError}>	
					<Text style={style.errorText}>
					{ translate('password_wrong') }
					</Text> 
				</View>
			)
		}
	}

	// using custom error-input class
	render() {
		return(

		<View style={{width: "100%", height: "100%"}}>
			<View style={{position: 'absolute', top: 0, left: 0, height: 534}}>
				<Image 
				source={require('../../assets/img/login_theme_stripes_fix.png')}
				style={{position: 'absolute', bottom: 20, right: -320, height: 200, width: 130, resizeMode: 'cover'}}
				/>
			</View>
			
			<View style={style.container}>

				<View style={style.header}>
					<View style={style.headerIcon}>
						<Image source={require('../../assets/img/hhIcon.png')} style={style.hhIcon}/>
					</View>
					<View style={style.headerText}>
						<Text style={style.hamrText}> {translate("hamr")} </Text>
					</View>
				</View>

				<View style={style.loginBox}>

					<View style={style.login}>
						<View style={{alignItems: "center", justifyContent: "center"}}>
						<TextInput
							placeholder={translate("username")} 
							placeholderTextColor={'grey'} 
							onChangeText={this.usernameChange}
							style={style.input}
							returnKeyType="next"
							onSubmitEditing={() => { this.secondTextInput.focus(); }}
							blurOnSubmit={false}
							value={this.state.username} />

						{ this.renderUserError() }
						</View>

						<View style={{alignItems: "center", justifyContent: "center"}}>
						<TextInput
							ref={(input) => { this.secondTextInput = input; }}
							placeholder={translate("password")} 
							secureTextEntry={true}
							placeholderTextColor={'grey'} 
							onChangeText={this.passwordChange}
							style={style.input}
							returnKeyType="go"
							onSubmitEditing={ this.tryLogin }
							value={this.state.password} />

						{ this.renderPasswordError() }
						</View>


						<View style={style.remember}>

							<View style={style.checkView}>
								<CheckBox value={this.state.rememberToggle} onValueChange={this.toggleRemember} />
								<TouchableNativeFeedback>
									<Text> {translate("remember_me")} </Text>
								</TouchableNativeFeedback>
							</View>

							<View style={style.help}>
								<Icon name={'lifebuoy'} size={20} color={'black'} onPress={() => alert(translate('remember_login'))} />
							</View>

						</View>
					</View>


					<View style={style.loginButton}>
						<AwesomeButton 
						backgroundColor={color.light_green} 
						backgroundDarker={color.light_green_darker} 
						textSize={30} width={235}
						textColor={'white'}
						borderColor={color.light_green_darker}
						onPress={this.tryLogin}>
							<Text style={{fontSize: 26, color: "white", fontWeight: "bold"}}>{translate("login")}</Text>
						</AwesomeButton>
					</View>

				</View>


			</View>
			
			
		</View>
		)
	}
}





const style = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		padding: 2,
		paddingTop: 15
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
	loginBox: {
		padding: 5,
		borderRadius: 10,
		marginTop: 0,
		paddingTop: 0
	}, 
	bigText: {
		fontSize: 63,
		color: 'red'
	},
	input: {
		borderWidth: 1,
		width: 235,
		margin: 5,
		paddingLeft: 10,
		padding: 5,
		fontSize: 16,
		justifyContent: 'center',
	},
	subtitle: {
		fontSize: 16,
		marginBottom: 10,
		paddingLeft: 3
	},
	login: {
		// margin: 5,
		marginBottom: 20,
		padding: 3,
		width: 275,
		justifyContent: "center",
	},
	loginError: {
		justifyContent: 'center',
		paddingTop: 5,
		paddingBottom: 5
	},
	passwordError: {
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 5,
		paddingBottom: 5
	},
	errorText: {
		color: 'red',
		fontSize: 14,
		fontWeight: "bold"
	},
	remember: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: 257,
		marginLeft: 10
	},
	checkView: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		
	},
	help: {
		// backgroundColor: 'black',
		width: 40,
		marginRight: 5,
		justifyContent: 'center',
		alignItems: 'center'
	},
	loginButton: {
		// backgroundColor: 'grey'
		alignItems: "center"
	}
})
