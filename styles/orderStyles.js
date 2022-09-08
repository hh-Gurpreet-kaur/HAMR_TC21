import { StyleSheet } from 'react-native'
import color from './colors'

const orderStyles = StyleSheet.create({
    container: {
		width: "100%",
	},

	// main image
	imgBox: {
		// marginBottom: 10
		alignItems: 'center',
		justifyContent: 'center',
		height: 95,
		width: "75%",
		marginTop: 2,
		marginBottom: 3,
	},
	img: { 
		resizeMode: 'contain',
		width: 95,
		height: 95,
		marginTop: 2,
	},
	img_small: {
		resizeMode: 'contain',
		width: 20,
		height: 20,
		marginTop: 2,
	},
	box: {
		borderWidth: 1,
		borderColor: 'black',
		margin: 2
	},
	center: {
		alignItems: 'center',
		justifyContent: 'center',
		// backgroundColor: 'red'
	},
	status: {
		flexDirection: 'row',
		marginTop: 3,
		justifyContent: 'space-between',
		marginLeft: 5,
		marginRight: 5,
		alignItems: "center",
		marginBottom: 4
	},
	title: {
		fontSize: 15,
		color: 'black',
	},
	active: {
		backgroundColor: color.active,
		padding: 2,
		margin: 2
	},
	inactive: {
		backgroundColor: color.inactive,
		padding: 2,
		margin: 2
	},
	nonStatus: {
		margin: 14,
		padding: 2
	},
	bigText: {
		fontSize: 26,
		color: 'black'
	},
	largeText: {
        fontSize: 19,
        color: 'black',
		fontWeight: 'bold',
		paddingVertical: 2,
    },
	quantity: {
		flexDirection: 'row', 
		alignItems: 'center', 
		justifyContent: 'space-between',
		borderColor: 'black',
		borderWidth: 1,
		paddingLeft: 2,
		width: 100,
	},
	qtyInput: {
        borderWidth: 0,
        minWidth: 45,
		fontSize: 19,
		paddingVertical: 2,
    },
	correct: {
		//marginLeft: 10,
		alignItems: 'center',
		flexDirection: 'row',
		marginBottom: 3
	},
	// order BOX
	orderBox: {
		alignItems: 'center',
	},
	orderPrintPanel: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: "center",
		width: "100%",
		marginTop: 2,
	},
	row: {
		width: "100%", 
		flexDirection: "row", 
		justifyContent: 'space-between', 
		alignItems: 'center', 
		paddingHorizontal: 5, 
		paddingBottom: 5
	},
	rowCentred: {
		justifyContent: 'space-between',
		marginVertical: 10,
		paddingBottom: 0,
		paddingRight: 40
	},
	twoColumn: {
		width: "100%", 
		flexDirection: "row", 
		justifyContent: 'space-between', 
		paddingHorizontal: 5, 
		paddingBottom: 4
	},
	largeColumn: {
		width: "56%"
	},
	smallColumn: {
		width: "44%",
		paddingLeft: 5
	},
	description: {
		fontSize: 15,
		color: "black", 
		width: "100%", 
		textAlign: "center"
	},
	btn: {
		padding: 5,
		alignItems: 'center',
		borderColor: 'black',
		borderWidth: 1,
		backgroundColor: 'white',
		justifyContent: 'center',
		backgroundColor: color.light_grey,
		height: 35,
		borderRadius: 5,
		width: "49%"
	},
	orderBtnText: {
		fontSize: 17, 
		color: "white", 
		fontWeight: "bold"
	},
	btnText: {
		fontSize: 15,
		color: 'black',
		textAlign: 'center'
	},
	itemInput: {
		paddingVertical: 2,
		paddingHorizontal: 5,
		borderWidth: 1,
		backgroundColor: 'white',
		fontSize: 16,
		width: 310,
	}
})

export default orderStyles;