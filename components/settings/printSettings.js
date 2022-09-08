import React from 'react'
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	Picker,
	CheckBox,
	BackHandler,
	ActivityIndicator
} from 'react-native'
import {Item} from '../mainPage/home'

import AwesomeButton from "react-native-really-awesome-button";

import addHeader from '../../hoc/addHeader'
import { translate } from '../../translations/langHelpers'
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import Bluetooth from '../printing/bluetooth'
import PrinterConfig from '../printing/printerConfig'
import color from '../../styles/colors';
import Settings from './settings';

class PrintSettings extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			autoPrint: Settings.autoPrint,
			printerAddress: Settings.printerAddress,
			labelType: Settings.labelType,
			loading: false
		}
	}

	saveLabelType = (val) => {
		Settings.saveLabelType(val);
		this.setState({ labelType: val })
	}

	onConnect = async () => {
		Settings.savePrinterAddress(this.state.printerAddress);

		this.setState({loading: true});

		let success = false;
		let regMacAddress = new RegExp('^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$');

		if (regMacAddress.test(this.state.printerAddress)){
			if (!(await Bluetooth.BluetoothEnabled())) {
				alert(translate('bluetooth_disabled'));
			}
			else {
				success = await Bluetooth.Connect(this.state.printerAddress.toUpperCase());

				if (success) {
					// slicing 13 removes 'Connected to ' and leaves device name
					let deviceName = success.message.slice(13);		
					alert(translate('connected_message', {name: deviceName}));
				} else {
					alert(translate('connection_failed'));
				}
			}
			
		} else {
			alert(translate('invalid_mac'));
		}

		this.setState({loading: false});
	}

	onSendFonts = async () => {
		if (await PrinterConfig.sendFonts(this.state.printerAddress)) {
			alert(translate('fonts_success'));
		} else {
			alert(translate('fonts_fail'));
		}
	}

	onToggleAutoPrint = () => {
		Settings.saveAutoPrint(!this.state.autoPrint);
		this.setState({ 
			autoPrint: !this.state.autoPrint 
		})
	}

	formatMac(text) {
		console.log(text);
		let formattedText = "";

		for (let i = 0; i < text.length; i+=2) {
			formattedText += (text.substr(i, 2) + ":");
		}
		return formattedText.slice(0, -1);
	}

	onChangeMac = (text) => {
		let formattedText = text;

		if (text.charAt(text.length - 1) == '|') {
			formattedText = text.slice(-13, -1);
			formattedText = this.formatMac(formattedText)
			this.setState({
				printerAddress: formattedText
			});
			return;
		}

		if (text.length > this.state.printerAddress.length) {
			if (text.length <= 17) {
				if ( text.length <= 16) {
					if ((text.length - 2) % 3 == 0) {
						formattedText += ":";
					}
				}

				this.setState({
					printerAddress: formattedText
				});
			}


		} else {
			if ((text.length - 2) % 3 == 0) {
				formattedText = text.slice(0, -1);
			}

			this.setState({
				printerAddress: formattedText
			});
		}

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

	render() {
		let pointerEvents = this.state.loading ? "auto" : "none";
		return(
		<ScrollView style={{flex: 1, width: "100%"}} pointerEvents={pointerEvents}>
		<View style={style.container}>
			<Item 
			 title={translate("print_title")}
			 icon={'printer-wireless'}
			 back={color.light_grey}
			 iconColor={'#f2561d'} />

			<View style={style.sectionLeft} >

				<Text style={style.title}>{translate("connect_printer")} </Text>
				<Text style={style.subtitle}>{translate("connect_printer_desc")}</Text>
				<View style={{width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingRight: 8}}>
					<TextInput
						autoCompleteType='off'
						autoCapitalize='characters'
						autoCorrect={false}
						style={style.inp}
						placeholder={translate("printer_placeholder")} 
						value={this.state.printerAddress}
						onChangeText={this.onChangeMac}
					/>
					<View>
						<AwesomeButton backgroundColor={'#26a061'} width={145} height={40} onPress={this.onConnect}>
							<Text style={{color: "white", fontWeight: "bold"}}>{translate('connect')}</Text>
						</AwesomeButton>
					</View>
					
				</View>
				

			</View>

			<View style={style.sectionLeft} >
				<Text style={style.title}>{translate("label_type")} </Text>
				<Picker
					selectedValue={this.state.labelType}
					onValueChange={(val) => {
						this.saveLabelType(val)
					}}
					style={style.pick}>

					<Picker.Item label={translate("shelf_label")} value="shelf" />
					<Picker.Item label={translate("upc_label")} value="upc" />

				</Picker>

				<View style={{ flexDirection: 'row', alignItems: "center"}}>
					
				    <CheckBox
				      value={this.state.autoPrint}
				      onValueChange={this.onToggleAutoPrint} />
				    <Text style={style.subtitle}> {translate("auto_print")} </Text>
				    
				</View>
			</View>

			<View style={style.sectionCenter}>
				<AwesomeButton backgroundColor={'#26a061'} width={220} height={40} onPress={this.onSendFonts}>
					<Text style={{color: "white", fontWeight: "bold"}}>{translate("send_fonts")}</Text>
				</AwesomeButton>
			</View>

		</View>

		{this.renderLoading()}

		</ScrollView>
		)
	}
}


export default addHeader(PrintSettings, 'Settings')

const style = StyleSheet.create({
	container: {
		flex: 1,
		padding: 2,
		backgroundColor: 'white',
		paddingBottom: 0
	},
	center: {
		justifyContent: 'center',
		alignItems: 'center'
	},
	sectionLeft: {
		marginBottom: 10,
		paddingBottom: 0,
		marginTop: 0,
		margin: 2,
		padding: 2,
		marginRight: 5,
		width: "100%"
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		color: 'black',
		marginLeft: 5
	},
	subtitle: {
		fontSize: 16,
		color: 'black',
		marginLeft: 5
	},
	sectionCenter: {
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 10
	},
	inp: {
		borderWidth: 0.9,
		borderColor: 'black',
		padding: 5,
		margin: 10,
		marginLeft: 5,
		marginBottom: 0,
		marginRight: 0,
		width: 150,
		height: 40,
		fontSize: 13
	},
	pick: {
		borderWidth: 1.5,
		borderColor: 'grey',
		marginBottom: 5
	},
	loading: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: "#F5FCFF88"
	  }
})