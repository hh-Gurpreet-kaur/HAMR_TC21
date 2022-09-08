import React from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity
} from 'react-native'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

export default function CustomDrawerItem(props) {

	const backColor = props.color || 'black'
	const icon = props.iconColor || 'white'

	onPress = () => {
		props.navigation.navigate(props.route)
	}

	if (props.isItemVisible) {
		return(
			<TouchableOpacity style={style.container} onPress={this.onPress}>
				<View style={[style.icon, {backgroundColor: backColor}]}>
					<Icon
					 name={props.icon}
					 size={25} 
					 color={icon}/>
				</View>
	
				<View style={style.title}>
					<Text style={style.titleText}>
						{props.title}
					</Text>
				</View>
			</TouchableOpacity>
		)
	}
	else {
		return null;
	}
	
}

// local stylesheet
const style = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		// padding: 5,
		marginBottom: 10,
		marginTop: 10
	},
	icon: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 40,
		width: 40,
		marginLeft: 12,
		borderRadius: 50
	},
	title: {
		// backgroundColor: 'green',
		justifyContent: 'center',
		margin: 2,
		marginLeft: 12,
	},
	titleText: {
		fontSize: 22,
		color: 'black',
		fontWeight: 'bold'
	}
})