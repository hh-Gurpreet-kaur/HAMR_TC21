import React from 'react'
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableNativeFeedback,
	ScrollView,
	Dimensions
} from 'react-native'

import { translate } from '../../translations/langHelpers'
import color from '../../styles/colors'

const SCREEN_WIDTH = Math.round(Dimensions.get('window').width) - 2;
const ITEM_HEIGHT = 28;

export default class Table extends React.Component {

	onLayout = () => {
		const scrollIndex = this.props.tableData ? this.props.tableData.length - 1 : 0;

		if (scrollIndex >= 0) {
			this.list.scrollToIndex({index: scrollIndex})
		}
	}

	render() {
		const columnOneWidth = 90;
		const columnTwoWidth = 68;
		const columnThreeWidth = 83;
		let columnFourWidth = 100;

		columnFourWidth = SCREEN_WIDTH - columnOneWidth - columnTwoWidth;
		columnFourWidth = this.props.costVisible ? columnFourWidth - columnThreeWidth : columnFourWidth;

		return(
			<View style={{ flex: 1}}>
				<View style={[rowStyle.container, {backgroundColor: color.table_header, paddingLeft: 2}]}> 
					<View style={[rowStyle.cell, {width: 90} ]}>
						<Text style={[rowStyle.cellHeader, {fontWeight: 'bold', color: 'black'}]}> {this.props.tableHead[0]} </Text>
					</View>
					<View style={[rowStyle.cell, {width: 68} ]}>
						<Text style={[{fontWeight: 'bold', fontSize: 17.5, color: 'black', textAlign: 'center'}]}> {this.props.tableHead[1]} </Text>
					</View>
					{ this.props.costVisible &&
						<View style={[rowStyle.cell, {width: 83} ]}>
							<Text style={[rowStyle.cellHeader, {fontWeight: 'bold', color: 'black', textAlign: 'center'}]}> {this.props.tableHead[2]} </Text>
						</View>
					}
					
					<View style={[rowStyle.cell, { minWidth: columnFourWidth}]}>
						<Text style={[rowStyle.cellHeader, {fontWeight: 'bold', color: 'black'}]}> {this.props.tableHead[3]} </Text>
					</View>
				</View>
				<ScrollView style={rowStyle.container} horizontal={true}>

				<FlatList
					ref={el => this.list = el}
					keyExtractor={(item, index) => index.toString()}
					data={this.props.tableData}
					onContentSizeChange={this.onLayout}
					getItemLayout={(data, index) => (
							{length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index}
						)}
					renderItem={ ({item, index}) => 
						<Row index={index} 
							upc={item.key} 
							itemNumber={item.item} 
							boh={item.boh} 
							onPress={this.props.rowPress} 
							descr={item.descr} 
							costVisible={this.props.costVisible}
							back={item.back} /> } />
				</ScrollView>
				
			</View>
		)
	}


}


// represents single clickable row in list
class Row extends React.Component {
	// props

	constructor(props) {
		super(props)
	}
	


	render() {
		const no = this.props.itemNumber
		const boh = this.props.boh
		const descr = this.props.descr || ''

		return(
			<TouchableNativeFeedback onPress={ () => { this.props.onPress(this.props) } }>
			<View style={[rowStyle.container, {backgroundColor: this.props.back || 'white'}]}> 
				<View style={[rowStyle.cell, {width: 90 } ]}>
					<Text style={rowStyle.cellText}>{this.props.upc} </Text>
				</View>
				<View style={[rowStyle.cell, {width: 68, alignItems: 'center' } ]}>
					<Text style={rowStyle.cellText}>{no} </Text>
				</View>
				{ this.props.costVisible &&
					<View style={[rowStyle.cell, {width: 83, alignItems: 'center' } ]}>
						<Text style={rowStyle.cellText}>{boh} </Text>
					</View>
				}
				<View style={rowStyle.cell}>
					<Text style={rowStyle.cellText}>{descr} </Text>
				</View>
			</View>
			</TouchableNativeFeedback>
		)
	}


}

const rowStyle=StyleSheet.create({
	container: {
		flexDirection: 'row',
	},
	cell: {
		// borderWidth: 1,
		paddingTop: 2,
		paddingBottom: 2,
		//height: ITEM_HEIGHT
		
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