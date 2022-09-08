import React from 'react'
import {
	Text,
	View,
	StyleSheet,
	TouchableNativeFeedback
} from 'react-native'


class NumberPicker extends React.Component {
	
	constructor(props) {
		super(props)
		this.state = {
			value: 0
		}
	}

	inc = () => {
		let update = this.state.value
		++update
		this.setState({
			value: update
		})
	}

	dec = () => {
		let update = this.state.value
		if (update!=0) {
			--update
			this.setState({
				value: update
			})
		}
		
	}

	render() {
		return(
			 <View style={style.box}>
			 	<View style={style.number}>
			 		<Text> {this.state.value} </Text>
			 	</View>

			 	<View style={style.arrows}>
			 		<TouchableNativeFeedback style={style.up} onPress={this.inc}>
			 			<Text> Up </Text>
			 		</TouchableNativeFeedback>
			 		<TouchableNativeFeedback style={style.up} onPress={this.dec}>
			 			<Text> Down </Text>
			 		</TouchableNativeFeedback>
			 		
			 	</View>


			 </View>
		)
	}
}

const style = StyleSheet.create({
	box: {
		borderWidth: 1,
		borderColor: 'black',
		margin: 2,
		height: 40,
		width: 90,
		flexDirection: 'row',
		flex: 1,
	},
	number: {
		flexDirection: 'row',

	},
	arrow: {

	},
	up: {
		height: 5
	}

})

export default NumberPicker