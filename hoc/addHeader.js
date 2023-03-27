import React from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableNativeFeedback,
	Keyboard
} from 'react-native'

import Icon from 'react-native-vector-icons/MaterialIcons';
import color from '../styles/colors';
import { translate } from "../translations/langHelpers";
Header = (props) => {
	return(
		<View style={style.header}>
			<TouchableNativeFeedback
				onPress={ props.onDrawerPress }>
				<View style={style.headerButton}>
					<Icon name={'menu'} size={35} color={color.grey} />
				</View>
			</TouchableNativeFeedback>
			<View style={style.headerContent}>
				<Text style={style.headerText}>
					{props.title}
				</Text>
			</View>
		</View>
	)
}

export default function addHeader(Passed, Title) {

	return class extends React.Component {

		onDrawerPress = () => {
			Keyboard.dismiss();
			this.props.navigation.toggleDrawer();
		}
// translate(Title) translates header title, add translation for every page default header title in en and fr pages
		render() {
			return(
				<View style={{flex: 1}}>
					<Header title={translate(Title)} onDrawerPress={this.onDrawerPress} {...this.props} />
					<Passed {...this.props} />
				</View>
			)
		}
	}
}


const style=StyleSheet.create({
	header: {
		height: 50,
		padding: 5,
		backgroundColor: 'black',
		shadowColor: 'black',
		shadowRadius: 10,
		shadowOffset: {
			width: 5,
			height: 5
		},
		flexDirection: 'row',
	},
	headerButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		// backgroundColor: 'green'
	},
	headerContent: {
		margin: 10,
		justifyContent: 'center',
		marginLeft: 20,
		// backgroundColor: 'grey',
		padding: 5
	},
	headerText: {
		fontSize: 22,
		color: 'white',
		fontWeight: 'bold'
	}
})