import React from 'react'
import {
	TouchableNativeFeedback,
	View,
	Text,
	StyleSheet
} from 'react-native'

import Icon from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'

// Single Item Design
export default class Item extends React.Component {
	constructor(props) {
		super(props) 
	}

	renderIcon() {
		console.log(this.props.iconLib);
		if (this.props.iconLib == 'FontAwesome') {
			return (
				<FontAwesome name={this.props.icon} size={75} color="#ff3838" />
			)
		}
		else {
			return (
				<FontAwesome name={this.props.icon} size={75} color="#ff3838" />
			)
		}
	}

	render () {
		return (
			<TouchableNativeFeedback>
				<View style={style.outerLi}>
		
				<View style={style.iconLi}>
					{ this.renderIcon() }
				</View>
		
				<View style={style.textLi}>
					<View style={style.textHoldLi}>
						<Text style={style.titleLi}> {this.props.title} </Text>
						<Text style={style.bodyLi}> {this.props.body} </Text>
					</View>
				</View>
		
				</View>
				
			</TouchableNativeFeedback>
		);
	}
	
}

const style = StyleSheet.create({
	// Li -> List Item Styles
	
})