import React from 'react'
import {
	View, 
	Text,
	StyleSheet,
	Button,
	BackHandler
} from 'react-native'

import {Item} from '../mainPage/home'

import GeneralSettings from './generalSettings'
import PrintSettings from './printSettings'
import { translate } from '../../translations/langHelpers'

import addHeader from '../../hoc/addHeader'

class SettingsRouter extends React.Component {
	componentDidMount() {
	/*	this.bh = BackHandler.addEventListener('hardwareBackPress', () => {
			this.props.navigation.goBack()
			return true
		})*/
	}

	componentWillUnmount() {
		//this.bh.remove()
	}

	render() {
		return(
			<View style={style.container}>
				<Item 
				 title={translate("general_title")}
				 body={translate("general_desc")}
				 icon={'cellphone-settings-variant'}
				 iconColor={'#f2561d'}
				 onPress={() => this.props.navigation.navigate('GeneralSettings_Settings')} />
				<Item 
				 title={translate("print_title")}
				 body={translate("print_desc")}
				 icon={'printer-wireless'}
				 iconColor={'#f2561d'}
				 onPress={() => this.props.navigation.navigate('PrintSettings_Settings')} />
				<Item 
				 title={translate("sync_title")}
				 body={translate("sync_desc")} 
				 icon={'folder-sync'}
				 iconColor={'#f2561d'}
				 onPress={() => this.props.navigation.navigate('Sync')} />
			</View>
		)
	}
}

const style = StyleSheet.create({
	container: {
		flex: 1,
		padding: 3, 
		backgroundColor: 'white'
	}
})

export default addHeader(SettingsRouter, 'Settings')