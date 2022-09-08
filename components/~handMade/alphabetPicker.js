import React from 'react'
import { View, Text, Modal, TextInput, StyleSheet, TouchableOpacity, SectionList } from 'react-native'

import AlphabetSectionList from 'react-native-alphabet-sectionlist'
import sectionListGetItemLayout from 'react-native-section-list-get-item-layout'
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import colors from '../../styles/colors';
import { translate } from '../../translations/langHelpers';

const ITEM_HEIGHT = 40;
const SECTION_HEIGHT = 30;

export default class AlphabetPicker extends React.PureComponent {

	

	constructor(props) {
		super(props);

		this.state = {
			data: {},
			filter: "",
			hideAlpha: false
		}

		
	}

	componentWillReceiveProps(newProps) {
		if (
			(!this.props.visible && newProps.visible) ||
			this.props.options !== newProps.options
		) {
			this.filterData("", newProps.data);
		}

	}


	filterData(text, data) {
		let filter = text.toUpperCase();
		const filteredData = !filter.length
      	? data
      	: data.filter(
          ({ searchKey, name }) =>
		  	name.toUpperCase().indexOf(filter) >= 0 ||
            (searchKey && searchKey.toUpperCase().indexOf(filter) >= 0)
		)


		let a = 65;
		let sectionData = {};

		sectionData['#'] = [];

		for (var i = 0; i < 26; i++) {
			charCode = String.fromCharCode(a + i);
			sectionData[charCode] = [];
		}

		for (var i = 0; i < filteredData.length; ++i) {
			let section = filteredData[i].name;
			let charCode = section.charAt(0).toUpperCase();

			if (this.isLetter(charCode)) {
				sectionData[charCode].push({ name: section })
			} else {
				sectionData['#'].push({ name: section })
			}

		}

		// delete # section if no items exist
		if (sectionData['#'].length == 0) {
			delete sectionData['#'];
		}

		// delete all alpha sections where no items exist
		for (var i = 0; i < 26; i++) {
			if (sectionData[String.fromCharCode(a + i)].length == 0) {
				delete sectionData[String.fromCharCode(a + i)];
			}
		}

		this.setState({
			filter: text,
			data: sectionData,
			hideAlpha: filter.length > 0
		})

	}

	isLetter(str) {
		return str.length === 1 && str.match(/[a-z]/i);
	}


	renderItem = ({ item }) => {
		return (
			<TouchableOpacity style={style.item} onPress={() => { this.onPressItem(item) }}>
				<Text style={style.itemText}>{item.name}</Text>
			</TouchableOpacity>
		)
	}

	renderSectionHeader = ({ section: { title } }) => {
		return (
			<View style={style.sectionHeader}>
				<Text style={style.headerText}>{title}</Text>
			</View>
		)
	}

	renderEmpty = () => {
		return (
			<View style={style.noResults}>
				<Text style={style.noResultsText}>{translate('no_results')}</Text>
			</View>
		)
	}

	onFilter = (filterText) => {
		this.filterData(filterText, this.props.data);
	}

	onPressItem = (item) => {
		this.props.onSelect(item);
	}

	onScroll = () => {
		ReactNativeHapticFeedback.trigger("impactLight",  {
			ignoreAndroidSystemSettings: true
		});
	}


	render() {
		const getItemLayout = sectionListGetItemLayout({
			getItemHeight: () => ITEM_HEIGHT,
			getSectionHeaderHeight: () => SECTION_HEIGHT,
		})

		let numSections = Object.keys(this.state.data).length;
		console.log(numSections);
		let fontSize = 13;
		
		if (numSections > 24) {
			fontSize = 11.25;
		} else if (numSections > 22) {
			fontSize = 11.5
		}

		return (
			<Modal visible={this.props.visible} onRequestClose={this.props.onRequestClose}>
				<TextInput
					style={style.filterBox}
					placeholder={this.props.placeholder}
					onChangeText={this.onFilter}
					value={this.state.filter}
				/>
				<AlphabetSectionList
					data={this.state.data}
					renderItem={this.renderItem}
					renderSectionHeader={this.renderSectionHeader}
					sectionListFontStyle={{ fontSize: fontSize }}
					rightSectionStyle={style.rightSectionStyle}
					getItemLayout={getItemLayout}
					updateScrollState={false}
					hideRightSectionList={this.state.hideAlpha}
					keyboardShouldPersistTaps='handled'
					showsVerticalScrollIndicator={false}
					onScrollToSection={this.onScroll}
					stickySectionHeadersEnabled={false}
					ListEmptyComponent={this.renderEmpty}
				/>
			</Modal>
		)
	}
}


let style = StyleSheet.create({
	filterBox: {
		width: "100%",
		height: 40,
		padding: 10,
		borderBottomWidth: 2,
		borderBottomColor: "lightgray",
		color: 'black'
	},
	item: {
		marginLeft: 10,
		paddingVertical: 10,
		height: ITEM_HEIGHT,
		borderBottomColor: 'lightgray',
		borderBottomWidth: 0.5
	},
	itemText: {
		color: "black"
	},
	sectionHeader: {
		paddingLeft: 10,
		backgroundColor: colors.light_grey,
		paddingVertical: 5,
		height: 30
	},
	headerText: {
		color: "blue"
	},
	rightSectionStyle: {
		backgroundColor: colors.light_grey,
		width: 35,
		right: 0,
		alignItems: "center",
		borderRadius: 15
	},
	textContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: 40
	},
	noResultsText: {
		fontSize: 18
	},
	noResults: {
		padding: 10,
		width: "100%",
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	}
})