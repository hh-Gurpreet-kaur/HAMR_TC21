import React from 'react'
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableNativeFeedback,
	ScrollView
} from 'react-native'

import { translate } from '../../translations/langHelpers'
import color from '../../styles/colors'

const ITEM_HEIGHT = 28;

export default class Table extends React.Component {

	constructor(props) {
		super(props)
		this.state = {
			shouldScroll: true
		}
	}

	onPressOne = () => {
		this.props.onPressHeader(1);
	}

	onPressTwo = () => {
		this.props.onPressHeader(2);
	}

	onPressThree = () => {
		this.props.onPressHeader(3);
	}

	onLayout = () => {
		const scrollIndex = this.props.tableData ? this.props.tableData.length - 1 : 0;

		if (this.state.shouldScroll && scrollIndex >= 0) {
			this.list.scrollToIndex({index: scrollIndex})
		} else {
			this.state.shouldScroll = true;
		}
	}

	componentWillUpdate(nextProps) {
		if (nextProps.tableData.length < this.props.tableData.length) {
			this.state.shouldScroll = false;
		}
	}

	render() {

		return (
			<ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
				<View>
					<FlatList
						ref={el => this.list = el}
						keyExtractor={(item, index) => index.toString()}
						data={this.props.tableData}
						onContentSizeChange={this.onLayout}
						getItemLayout={(data, index) => (
							{length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index}
						)}
						renderItem={({ item, index }) => 
							<Row
								navigation={this.props.navigation}
								itemNumber={item.key} boh={item.boh}
								onPress={this.props.rowPress}
								descr={item.descr}
								index={index}
								back={item.back}
								onPressRow={this.props.onPressRow} />} />
				</View>
			</ScrollView>

		)
	}


}


// represents single clickable row in list
class Row extends React.PureComponent {

	// recieve props
	constructor(props) {
		super(props)
	}

	// row trigger
	trigger = () => {
		this.props.onPressRow(this.props.itemNumber)
	}

	render() {
		const no = this.props.itemNumber
		const boh = this.props.boh
		const descr = this.props.descr || ''
		let back = 'white';
		if (this.props.back == color.delete_line) {
			back = this.props.back;
		} else {
			back = this.props.index % 2 == 0 ? color.grey : 'white'
		}

		return (
			<TouchableNativeFeedback onPress={this.trigger}>
				<View style={[rowStyle.container, { backgroundColor: back }]}>
					<View style={[rowStyle.cell, { width: 100 }]}>
						<Text style={rowStyle.cellText}>{no} </Text>
					</View>
					<View style={[rowStyle.cell, { width: 65, alignItems: 'center' }]}>
						<Text style={rowStyle.cellText}>{boh} </Text>
					</View>
					<View style={[rowStyle.cell, {minWidth: 154}]}>
						<Text style={rowStyle.cellText}>{descr} </Text>
					</View>
				</View>
			</TouchableNativeFeedback>
		)
	}


}

const rowStyle = StyleSheet.create({
	container: {
		flexDirection: 'row',
	},
	cell: {
		// borderWidth: 1,
		paddingTop: 2,
		paddingBottom: 2,
	},
	cellText: {
		fontSize: 18,
		color: 'black',
		paddingLeft: 12
	},
	cellHeader: {
		fontSize: 17.5,
		color: 'black',
		paddingLeft: 5,
	}
})