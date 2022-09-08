import React from 'react'
import {
	View,
	Text, 
	TextInput,
	StyleSheet
} from 'react-native'



// aligned form components
export default class RowInput extends React.Component {

	// default props
	constructor(props) {
		super(props)
		this.inpStyle = StyleSheet.create({
			title: {
				color: 'black',
				fontSize: this.props.fontSize || 17
			},
			input: {
				borderWidth: 0.9,
				width:  this.props.width || 120,
				height: this.props.height || 30,
				padding: 0,
				paddingLeft: 10
			},
			inputRow: {
				margin: 2,
				padding: 2,
				flexDirection: 'row',
				justifyContent: 'space-around',
				alignItems: 'center'
			},
			centerOne: {
				flex: 1,
				// paddingLeft: 5,
				justifyContent: 'flex-end'
			},
			centerTwo: {
				flex: 1,
				// paddingLeft: 5,
				justifyContent: 'flex-end',
				marginLeft: 35
			}
		})
	}


	render() {
		return(
		<View style={this.inpStyle.inputRow}>

			<View style={this.inpStyle.centerOne}>
				<Text style={this.inpStyle.title}> {this.props.title} </Text>
			</View>

			<View style={this.inpStyle.centerTwo}>
				<TextInput style={this.inpStyle.input} />
			</View>

		</View>
		)
	}
}

