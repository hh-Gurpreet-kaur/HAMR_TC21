import React from 'react'
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	CheckBox,
	Keyboard,
	ScrollView,
	Image,
	ActivityIndicator
} from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler';

import AwesomeButton from 'react-native-really-awesome-button/src/themes/cartman'
import {Dropdown} from 'react-native-material-dropdown'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Scanning from '../misc/scanning'
import * as ItemStatus from '../misc/itemStatus';
import FilterPicker from '../~handMade/filterPicker';
import AlphabetPicker from '../~handMade/alphabetPicker'
import KeyEvent from 'react-native-keyevent'


import addHeader from '../../hoc/addHeader'

import sqldb from '../misc/database';
import { translate } from '../../translations/langHelpers'
import color from '../../styles/colors'

import Analytics from '../../analytics/ga';


class Search extends React.Component {
	currentScan = "";

	// React Functions
	constructor(props) {
		super(props)
		this.state = {
			active: false,
			stock: false,
			department: [],
			category: [],
			class: [],
			fineLine: [],
			sDepartment: '',
			sCategory: '',
			sCHash: '',
			sClass: '',
			sFLClass: '',
			input: '',
			visible: false,
			pickerData: [],
			level: 'dep',
			filterText: 'Search by Department name',
			loading: false
		}
	}

	handleScan = (keyEvent) => {
		if (!isNaN(keyEvent.pressedKey) || keyEvent.pressedKey == "|" || keyEvent.pressedKey == "^") {
			if (keyEvent.keyCode != 66) {
				this.currentScan += keyEvent.pressedKey;
			}
		} 

		if (keyEvent.pressedKey == "|") {
			this.state.input = this.currentScan;
			this.searchButton();
			this.currentScan = "";
		} else if (keyEvent.pressedKey == "^") {
			this.currentScan = "^";
			global.shouldNavigate = false;
		}
	}

	componentDidMount() {
		Analytics.trackScreenView("Search");
		this.populate();
		this.populateCat();
		this.populateClass();
		this.populateFlc();

		this.focusListener = this.props.navigation.addListener("didFocus",  e => {
			setTimeout(() => { this._scan.focus() }, 100);
			KeyEvent.onKeyUpListener((keyEvent) => {
				this.handleScan(keyEvent);
			});
		}); 
	}

	componentWillUnmount() { 
		this.focusListener.remove();
	}

	p = (str) => {
		let key = true
		if (key) {
			console.log(str)
		}
	}

	// UI + STATE SAVER HANDLERS

	// Toggler Handlers for ACTIVE / STOCK
	toggleActive = () => {
		this.setState({
			active: !this.state.active
		})
	}
	toggleStock = () => {
		this.setState({
			stock: !this.state.stock
		})
	}
	// main text box handler
	// classifies type and sends to correct handler
	changeBox = (text) => {
		if (text.charAt(text.length - 1) == '|') {
			let searchText = text.substring(text.indexOf("^"))
			this.state.input = searchText;
			this.searchButton();
		} else {
			this.setState({
				input: text
			})
		}

		
	}

	// helper function
	// find hash for hierarchy
	getHash = (collection, value) => {
		let baseValue = value.split('-')[0].trim();
		let results = collection.filter((x) => x.desc == baseValue)
		if (results.length > 0) {
			return results[0].key
		} else {
			return -1
		}
	}

	/*
	Main Idea / Pattern Used 

	Take state into account, construct query using appropriate handler
	Navigate to SearchResults page by passing final query as navigation parameter 

	*/

	// main entry point
	populate = () => {
		// get from department
		let depQ = `SELECT * from MHDepartment WHERE Description != '' ORDER BY Description;`
		sqldb.executeReader(depQ).then((results) => {
			// gather dropdown data for DEPARTMENT
			let len = results.length
			let department = []
			for (var i=0; i<len; ++i) {
				let x = {
					key: results.item(i).MHDepartmentHash,
					desc: results.item(i).Description,
					name: results.item(i).Description
				}
				department.push(x)
			}

			// set in state
			this.setState({
				department: department
			}) 
		})
	}

	populateCat = (query) => {
		let catQ = query || `SELECT * from MHCategory WHERE Description != '' ORDER BY Description;`
	
		sqldb.executeReader(catQ).then((results) => {
			// gather dropdown data for DEPARTMENT
			let len = results.length
			let cat = []
			for (var i=0; i<len; ++i) {
				let key = results.item(i).MHCategoryHash;
				let name = results.item(i).Description;
				let id = results.item(i).MHCategoryID;

				if (cat.length > 1 && cat[i - 1].desc == name) {
					name = name + " - " + id;
					cat[i-1].name = cat[i-1].desc + " - " + cat[i-1].id
				}

				let x = {
					key: key,
					name: name,
					id: id,
					desc: results.item(i).Description,
				}
				cat.push(x)
			}

			// set in state
			this.setState({
				category: cat
			}) 
		})
	}

	populateClass = (query) => {
		let clsQ = query || `SELECT * from MHClass WHERE Description != '' ORDER BY Description;`
		sqldb.executeReader(clsQ).then((results) => {
			// gather dropdown data for DEPARTMENT
			let len = results.length
			let cls = []
			for (var i=0; i<len; ++i) {
				let key = results.item(i).MHClassHash;
				let name = results.item(i).Description;
				let id = results.item(i).MHClassID;

				if (cls.length > 1 && cls[i - 1].desc == name) {
					name = name + " - " + id;
					cls[i-1].name = cls[i-1].desc + " - " + cls[i-1].id
				}

				let x = {
					key: key,
					name: name,
					id: id,
					desc: results.item(i).Description
				}

				cls.push(x)
			}

			// set in state
			this.setState({
				class: cls
			}) 
		})
	}

	populateFlc = (query) => {
		let flcQ = query || `SELECT * from MHFineLineClass WHERE Description != '' ORDER BY Description;`
		sqldb.executeReader(flcQ).then((results) => {
			// gather dropdown data for DEPARTMENT
			let len = results.length
			let flc = []
			for (var i=0; i<len; ++i) {
				let key = results.item(i).MHFineLineClassHash;
				let name = results.item(i).Description;
				let id = results.item(i).MHFineLineClassID;

				if (flc.length > 1 && flc[i - 1].desc == name) {
					name = name + " - " + id;
					flc[i-1].name = flc[i-1].desc + " - " + flc[i-1].id
				}

				let x = {
					key: key,
					name: name,
					id: id,
					desc: results.item(i).Description
				}

				flc.push(x)
			}

			// set in state
			this.setState({
				fineLine: flc
			}) 
		})
	}

	// fire query to display results
	fireQuery = (q, type) => {
		let nav = this.props.navigation
		
		switch (type) {
			case 'sku':
				this.p('by sku')
				nav.navigate('SearchResults', {
					query: q,
					type: type
				})
				this.setState({loading: false})
				break;
			case 'upc':
				this.p('by upc')
				nav.navigate('SearchResults', {
					query: q,
					type: type
				})
				break;
			case 'desc':
				this.p('by desc')
				nav.navigate('SearchResults', {
					query: q,
					type: type
				})
				break;
			case 'mhdesc':
				this.p('by mhdesc')
				nav.navigate('SearchResults', {
					query: q,
					type: type
				})
				break;
			case 'mh':
				this.p('by mh')
				nav.navigate('SearchResults', {
					query: q,
					type: type
				})
				break;
			default:
				break;
		}

		this.setState({
			loading: false
		})

	}

	// handler for fine line
	flSelect = (name) => {
		let results = this.state.fineLine.filter((x) => x.name == name)
		let hash = results[0].key

		let fineQ = `SELECT d.Description as deptDescription, d.MHDepartmentHash as deptHash,
			cat.Description as catDescription, cat.MHCategoryHash as catHash,
			cls.Description as clsDescription, cls.MHClassHash as clsHash
			FROM MHFineLineClass flc
			LEFT JOIN MHDepartment d on flc.MHDepartmentHash = d.MHDepartmentHash
			LEFT JOIN MHCategory cat on flc.MHCategoryHash = cat.MHCategoryHash
			LEFT JOIN MHClass cls on flc.MHClassHash = cls.MHClassHash
			WHERE flc.MHFineLineClassHash = ${hash}`

			sqldb.executeReader(fineQ).then((results) => {
				let dept = results.item(0).deptDescription
				let cat = results.item(0).catDescription
				let cls = results.item(0).clsDescription

				let flcQ = `SELECT * from MHFineLineClass WHERE MHClassHash = ${results.item(0).clsHash} AND Description != '';`
				this.populateFlc(flcQ);
				let catQ = `SELECT * from MHCategory WHERE MHDepartmentHash = ${results.item(0).deptHash} AND Description != '';`
				this.populateCat(catQ);
				let clsQ = `SELECT * from MHClass WHERE MHCategoryHash = ${results.item(0).catHash} AND Description != '';`
				this.populateClass(clsQ);
				
				// set in state
				this.setState({
					sCategory: cat,
					sDepartment: dept,
					sClass: cls,
					sFLClass: name
				})

			})
	}

	// handler for class select
	// fills out fine line dropdown
	classSelect = (name) => {
		// get hash
		let results = this.state.class.filter((x) => x.name == name)
		let hash = results[0].key

		let fineQ = `SELECT flc.MHFineLineClassHash, flc.Description, 
			d.Description as deptDescription, d.MHDepartmentHash as deptHash,
			cat.Description as catDescription, cat.MHCategoryHash as catHash
			FROM MHFineLineClass flc
			LEFT JOIN MHDepartment d on flc.MHDepartmentHash = d.MHDepartmentHash
			LEFT JOIN MHCategory cat on flc.MHCategoryHash = cat.MHCategoryHash
			WHERE flc.MHClassHash = ${hash}`
		sqldb.executeReader(fineQ).then((results) => {
			let len = results.length
			let fineLine = []
			for(var i=0; i<len; i++) {
				let x = {
					key: results.item(i).MHFineLineClassHash,
					name: results.item(i).Description,
					desc: results.item(i).Description
				}
				fineLine.push(x)
			}

			let dept = results.item(0).deptDescription
			let cat = results.item(0).catDescription

			let clsQ = `SELECT * from MHClass WHERE MHCategoryHash = ${results.item(0).catHash} AND Description != '';`
			this.populateClass(clsQ);
			let catQ = `SELECT * from MHCategory WHERE MHDepartmentHash = ${results.item(0).deptHash} AND Description != '';`
			this.populateCat(catQ);

			// set in state
			this.setState({
				sCategory: cat,
				sDepartment: dept,
				fineLine: fineLine,
				sClass: name,
				sFLClass: ''
			})
		})
	}

	// handler for category select
	// fills out class dropdown
	categorySelect = (name) => {
		let results = this.state.category.filter((x) => x.name == name)
		let hash = results[0].key

		let classQ = `SELECT cls.MHClassHash, cls.Description,
			d.MHDepartmentHash as deptHash, d.Description as deptDescription
			FROM MHClass cls
			LEFT JOIN MHDepartment d on cls.MHDepartmentHash = d.MHDepartmentHash
			WHERE cls.MHCategoryHash = ${hash}`
		sqldb.executeReader(classQ).then((results) => {
			let len = results.length
			let classData = [];
			for (var i=0; i<len; i++) {
				let x = {
					key: results.item(i).MHClassHash,
					name: results.item(i).Description,
					desc: results.item(i).Description
				}
				classData.push(x)
			}

			let dept = results.item(0).deptDescription

			let catQ = `SELECT * from MHCategory WHERE MHDepartmentHash = ${results.item(0).deptHash} AND Description != '';`
			this.populateCat(catQ);
			let flcQ = `SELECT * from MHFineLineClass WHERE MHCategoryHash = ${hash} AND Description != '' ORDER BY Description;`
			this.populateFlc(flcQ);

			// set in state
			this.setState({
				class: classData,
				sCategory: name,
				sDepartment: dept,
				sClass: '',
				sFLClass: ''
			})
		})
	}

	// handle department select
	// fills out category dropdown
	departmentSelect = (name) => {
		
		// get selected hash, by filtering
		let results = this.state.department.filter((x) => x.name == name)
		hash = results[0].key

		// get data for category
		let category = []
		let catQ = `SELECT MHCategoryHash, Description from MHCategory WHERE MHDepartmentHash = ${hash};`
		sqldb.executeReader(catQ).then((results) => {
			let len = results.length

			for (var i=0; i<len; ++i) {
				let x = {
					key: results.item(i).MHCategoryHash,
					name: results.item(i).Description,
					desc: results.item(i).Description
				}
				category.push(x)
			}
		})
		let clsQ = `SELECT * from MHClass WHERE MHDepartmentHash = ${hash} AND Description != '' ORDER BY Description;`
		this.populateClass(clsQ);
		let flcQ = `SELECT * from MHFineLineClass WHERE MHDepartmentHash = ${hash} AND Description != '' ORDER BY Description;`
		this.populateFlc(flcQ);

		// set in state, update state
		this.setState({
			category: category,
			sDepartment: name,
			sCategory: '',
			sClass: '',
			sFLClass: ''
		})
	}

	clearFilters = () => {
		this.populateCat();
		this.populateClass();
		this.populateFlc();

		this.setState({
			sDepartment: '',
			sCategory: '',
			sClass: '',
			sFLClass: '',
			input: '',
			active: false,
			stock: false
		})
	}

	// find by sku
	findBySku = (sku) => {

		let searchQ = `
		SELECT ItemMaster.SkuNum,
		ItemMaster.Description,
		ItemMaster.MfgNum,
		ItemMaster.StoreBOH,
		ItemMaster.WarehouseBOH FROM ItemMaster
		WHERE length(ItemMaster.SkuNum) = 7 
		AND ItemMaster.SkuNum = ${sku} LIMIT 1;
		`


		return searchQ
	}

	// find by upc
	findByUpc = (scan) => {
		let upc = Scanning.checkHomeUpc(scan);

		let searchQ = "";
		if (upc.length == 7) {
			searchQ = this.findBySku(upc);
		}
		else {
			searchQ = `
				SELECT ItemMaster.SkuNum,
				ItemMaster.Description,
				ItemMaster.MfgNum,
				ItemMaster.StoreBOH,
				ItemMaster.WarehouseBOH FROM ItemMaster
				INNER JOIN Upc on ItemMaster.SkuNum = Upc.SkuNum
				WHERE length(ItemMaster.SkuNum) = 7 
				AND Upc.UpcCode = '${upc}' LIMIT 1;
				`
		}

		return searchQ
	}

	// find by description
	findByDescription = (desc, active, stocked) => {

		// debug
		this.p('Search with ' + desc)

		let matchSku = ""
		matchSku += "("

		// get matching sku array
		let matches = []
		let skuQ = `SELECT ItemSku, Description, INSTR(Description, '${desc.toUpperCase()}') sw FROM Keywords WHERE sw > 0 LIMIT 2000`
		sqldb.executeReader(skuQ).then((results) => {
			let len = results.length

			for (var i=0; i<len; ++i) {
				let num = results.item(i).ItemSku

				matchSku += num.toString()
				if (i!=len-1) {
					matchSku += ", "
				}
			}
			matchSku += ")"

			let searchQ = `SELECT ItemMaster.SkuNum,
			ItemMaster.Description,
			ItemMaster.MfgNum,
			ItemMaster.StoreBOH,
			ItemMaster.WarehouseBOH FROM ItemMaster
			WHERE length(ItemMaster.SkuNum) = 7 
			AND ItemMaster.SkuNum in ${matchSku} `

			searchQ += this.addActiveStocked(active, stocked);

			// display results
			this.fireQuery(searchQ, 'desc')
		})
	}

	// find by mh
	findByMH = (active, stocked) => {
		// get all hashes
		let deptH = this.getHash(this.state.department, this.state.sDepartment)
		let catH = this.getHash(this.state.category, this.state.sCategory)
		let classH = this.getHash(this.state.class, this.state.sClass)
		let flcH = this.getHash(this.state.fineLine, this.state.sFLClass)

		// make query
		let searchQ = `SELECT ItemMaster.SkuNum,
		ItemMaster.Description,
		ItemMaster.MfgNum,
		ItemMaster.StoreBOH,
		ItemMaster.WarehouseBOH FROM ItemMaster
		WHERE length(ItemMaster.SkuNum) = 7 
		AND ItemMaster.MHDepartmentHash = ${deptH} `

		// handle hashes
		if (catH != -1 ) {
			searchQ += ` AND ItemMaster.MHCategoryHash = ${catH} `
		}
		if (classH != -1) {
			searchQ += ` AND ItemMaster.MHClassHash = ${classH} `
		}
		if (flcH != -1) {
			searchQ += ` AND ItemMaster.MHFineLineClassHash = ${flcH}`
		}

		searchQ += this.addActiveStocked(active, stocked);

		// fire query	
		return searchQ
	}

	// find by mh + descr
	findByMHDescription = (desc, active, stocked) => {
		// get all hashes
		let deptH = this.getHash(this.state.department, this.state.sDepartment)
		let catH = this.getHash(this.state.category, this.state.sCategory)
		let classH = this.getHash(this.state.class, this.state.sClass)
		let flcH = this.getHash(this.state.fineLine, this.state.sFLClass)

		// build query
		let searchQ = `SELECT ItemMaster.SkuNum,
		ItemMaster.Description,
		ItemMaster.MfgNum,
		ItemMaster.StoreBOH,
		ItemMaster.WarehouseBOH FROM ItemMaster 
		WHERE length(ItemMaster.SkuNum) = 7 
		AND ItemMaster.MHDepartmentHash = ${deptH} `

		// handle hashes
		if (catH != -1) {
			searchQ += `AND ItemMaster.MHCategoryHash = ${catH} `
		}
		if (classH != -1) {
			searchQ += `AND ItemMaster.MHClassHash = ${classH} `
		}
		if (flcH != -1) {
			searchQ += `AND ItemMaster.MHFineLineClassHash = ${flcH} `
		}

		// handle description
		let words = desc.split(" ")
		let len = words.length
		for (var i=0; i<len; ++i) {
			searchQ += `AND ItemMaster.Description LIKE '%${words[i]}%' `
		}

		searchQ += this.addActiveStocked(active, stocked);

		return searchQ
	}

	addActiveStocked(active, stocked) {

		let searchQ = ""

		// handle active + stock
		if (active) {
			const itemStatus = global.isThirdParty ? 1 : 12;

			if (global.isThirdParty) {
				searchQ += ` AND (ItemMaster.StoreItemStatus = ${itemStatus}) `;
			} else {
				searchQ += ` AND (ItemMaster.HHShipCode = ${itemStatus}) `;
			}
		}

		if (stocked) {
			searchQ += " AND (ItemMaster.StoreStocked = 1) "
		}

		return searchQ;
	}

	// handler for search button
	searchButton = async () => {
		this.state.loading = true;
		let str = this.state.input
		let active = this.state.active
		let stock = this.state.stock

		if (str.charAt(str.length - 1) == '|') {
			// pipe ('|') at end of string means barcode was scanned
			str = str.substring(1, str.length - 1);
			str = await Scanning.checkHomeUpc(str);
		}

		this.setState({input: str})

		// ^ not found in string
		if (str.indexOf('^') == -1) {
			if (this.state.previousSku == str) {
				global.loading = false;
			} else {
				global.loading = true;
			}

			// check for text
			let text = isNaN(str)
			let len = str.length

			// validifiers
			let sku = len == 7 && !text
			let upc = len >= 11 && !text
			let desc = text
			let mh = this.state.sDepartment != ''

			// route away!
			if (sku) {
				this.p('find by sku')
				this.state.previousSku = str;
				this.fireQuery(this.findBySku(str), 'sku')

			}
			if (upc) {
				this.p('find by upc')
				this.state.previousSku = str;
				this.fireQuery(this.findByUpc(str), 'upc')
			}

			if (desc && !mh) {
				this.p('find by desc')
				this.findByDescription(str, active, stock)
			}

			if (desc && mh) {
				this.p('find by mh + desc')
				this.fireQuery(this.findByMHDescription(str, active, stock), 'mhdesc')
			}

			if (mh && len == 0) {
				this.p('find by mh')
				this.fireQuery(this.findByMH(active, stock), 'mh')
			}	

			this.setState({
				scanText: "",
			})
			Analytics.logSearch(str);
			
			
		}

		
	}

	onSelect = (selected) => {
		this.state.visible = false;

		switch(this.state.level) {
			case 'dep':
				this.departmentSelect(selected.name);
				break;
			case 'cat':
				this.categorySelect(selected.name);
				break;
			case 'cls':
				this.classSelect(selected.name);
				break;
			case 'flc':
				this.flSelect(selected.name);
				break;
		}

		
	}

	onOpenPicker = (level) => {
		switch(level) {
			case 'dep':
				this.setState({
					level: level,
					pickerData: this.state.department,
					filterText: translate('filter_department'),
					visible: true
				});
				break;
			case 'cat':
				this.setState({
					level: level,
					pickerData: this.state.category,
					filterText: translate('filter_category'),
					visible: true
				});
				break;
			case 'cls':
				this.setState({
					level: level,
					pickerData: this.state.class,
					filterText: translate('filter_class'),
					visible: true
				});
				break;
			case 'flc':
				this.setState({
					level: level,
					pickerData: this.state.fineLine,
					filterText: translate('filter_flc'),
					visible: true
				});
				break;
		}
	}

	onCancel = () => {
		this.setState({
			visible: false 
		});
	}

	newScan = (scan) => {
		this.state.scanText = scan;
		this.state.input = scan;
		this.searchButton();
	}


	renderLoading() {
		if (this.state.loading) {
			console.log("Is Loading...");
			return (
				<View style={style.loading} pointerEvents="none">
					<ActivityIndicator size='large' />
				</View>
			)
		}
		
	}


	render() {
		return(
		<ScrollView style={{flex: 1, width: "100%"}} keyboardShouldPersistTaps={'handled'}>
			
			<View style={style.container}>
			
			<View style={style.sectionCenterTop}>
				<TextInput
					ref={(input) => this._scan = input}
					returnKeyType="search"
					placeholder={translate("search_placeholder")}
					placeholderTextColor="red"
					style={style.input} 
					value={this.state.input}
					onChangeText={this.changeBox}
					autoFocus={true}
					onSubmitEditing={this.searchButton}/>
				<View style={{flex: 1, flexDirection: "row", justifyContent: "space-between"}}>
					<View style={style.left}>
						<View style={style.checkView}>			
							<CheckBox
							style={{height: 25}}
							value={this.state.active}
							onValueChange={this.toggleActive} />
							<Text style={style.subtitle}> {translate("active_checkbox")} </Text>
						</View>

						{ global.isThirdParty && 
							<View style={style.checkView}>			
								<CheckBox
								style={{height: 25}}
								value={this.state.stock}
								onValueChange={this.toggleStock} />
								<Text style={style.subtitle}> {translate("in_stock_checkbox")}</Text>
							</View>
						}
						
					</View>
					<TouchableOpacity onPress={this.clearFilters}>
						<Image 
							source={require('../../assets/img/clear_filter_HAMR.png')}
							style={style.img} />
					</TouchableOpacity>
				</View>
			</View>

			<View style={style.sectionPickers}>
				<View style={style.picker}>
					<TouchableOpacity onPress={() => { this.onOpenPicker('dep') }}>
						<Dropdown
							fontSize={15}
							textColor={color.heading}
							selectedItemColor={color.heading}
							label={translate("department")}
							data={undefined}
							labelHeight={15}
							labelPadding={5}
							value={this.state.sDepartment}
							/>
					</TouchableOpacity>
				</View>
				<View style={style.picker}>
					<TouchableOpacity onPress={() => { this.onOpenPicker('cat') }}>
						<Dropdown
							fontSize={15}
							textColor={color.heading}
							selectedItemColor={color.heading}
							label={translate("category")}
							data={undefined}
							labelHeight={15}
							labelPadding={5}
							value={this.state.sCategory}
							/>
					</TouchableOpacity>
				</View>

				<View style={style.picker}>
					<TouchableOpacity onPress={() => { this.onOpenPicker('cls') }}>
						<Dropdown
							fontSize={15}
							textColor={color.heading}
							selectedItemColor={color.heading}
							label={translate("class")}
							data={undefined}
							labelHeight={15}
							labelPadding={5}
							value={this.state.sClass}
							/>
					</TouchableOpacity>
				</View>

				<View style={style.picker}>
					<TouchableOpacity onPress={() => { this.onOpenPicker('flc') }}>
						<Dropdown
							fontSize={15}
							textColor={color.heading}
							selectedItemColor={color.heading}
							label={translate("fine_line_class")}
							data={undefined}
							labelHeight={15}
							labelPadding={5}
							value={this.state.sFLClass}
							/>
					</TouchableOpacity>
				</View>

			</View>

			<View style={style.action}>
				<AwesomeButton  
					backgroundColor={color.light_green} 
					backgroundDarker={color.light_green_darker} 
					textSize={30} width={250}
					textColor={'white'}
					borderColor={color.light_green_darker}
					onPress={this.searchButton}> 
					<Text style={{fontSize: 26, color: "white", fontWeight: "bold"}}>{translate("search_btn")}</Text>
					</AwesomeButton>
			</View>

			<AlphabetPicker 
					visible={this.state.visible}
					onRequestClose={this.onCancel}
					data={this.state.pickerData}
					onSelect={this.onSelect}
					placeholder={this.state.filterText}
				/>
			</View>
			
			

			{this.renderLoading()}
				
		</ScrollView>
		)
	}
}

/*
<TextInput 
				ref={(screen) => this._screen = screen}
				style={style.screenfocus}
				value={this.state.scanText}
				showSoftInputOnFocus={false} 
				onChangeText={this.newScan}
				caretHidden={true} />
*/

const style = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'white',
		margin: 5,
		alignItems: "center",
		marginTop: 0		
	},
	input: {
		borderWidth: 0.9,
		borderColor: 'black',
		padding: 3,
		paddingLeft: 5,
		height: 40,
		width: "100%",
		fontSize: 19,
		marginBottom: 3
	},
	checkView: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 3
	},
	left: {
		justifyContent: 'flex-start',
		alignItems: 'baseline',
	},
	inp:{
		alignItems: 'baseline',
		justifyContent: 'flex-start'
	},
	subtitle: {
		fontSize: 14,
		color: color.heading
	},
	sectionLeft: {
		marginBottom: 7,
		padding: 5
	},
	sectionPickers: {
		marginTop: 15,
		width: "100%",
		marginBottom: 10,
		flex: 1
	},
	sectionCenterTop: {
		marginTop: 3,
		marginBottom: 4,
		width: "100%"
	},
	picker: {
		marginLeft: 5,
		width: "95%"
	},
	pickerC: {
		width: 280
	},
	action: {
		marginTop: 2,
	},
	img: { 
		flex: 1,
		resizeMode: 'contain',
		width: 70,
		height: 52,
	 },
	 screenfocus: {
		position: 'absolute',
		bottom:0,
		left: 0,
		width: 0,
		height: 0,
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

export default addHeader(Search, 'Search')