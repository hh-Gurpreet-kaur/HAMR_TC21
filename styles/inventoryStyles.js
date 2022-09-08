import { StyleSheet } from 'react-native'
import color from './colors';

const inventoryStyles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
        width: "100%"
    },
    imgBox: {
		// marginBottom: 10
		alignItems: 'center',
		justifyContent: 'center',
		height: 105,
		width: "55%",
	},
	img: { 
	   flex: 1,
	   resizeMode: 'contain',
	   width: 105,
	   height: 105,
	   marginTop: 5
	},
	box: {
		borderWidth: 1,
		borderColor: 'black',
		margin: 2
	},
    dualRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 2,
        marginTop: 2,
    },
    input: {
        borderWidth: 1,
        width: "100%",
        padding: 3,
        fontSize: 16,
        paddingLeft: 10
    },
    qtyInput: {
        borderWidth: 1,
        width: 75,
        height: 45,
        padding: 5,
        fontSize: 18
    },
    tagInput: {
        borderWidth: 1,
        width: "100%",
        padding: 3,
        fontSize: 16,
        borderColor: 'black',
        marginLeft: 10
    },
    description: {
        fontSize: 15, 
        color: 'black', 
        width: "100%", 
        textAlign: "center",
        marginBottom: 5
    },
    descBox: {
        alignItems: 'center', 
        justifyContent: 'center'
    },
    largeText: {
        fontSize: 24,
        color: 'black',
        fontWeight: 'bold'
    },
    title: {
        fontSize: 20,
        color: 'black',
    },
    orderBox: {
        alignItems: 'center',
        marginTop: 10
    },
    noDbModal: {
        padding: 0,
        backgroundColor: color.modal_back,
        flexDirection: 'row',
        // justifyContent: 'space-between',
    },
    modalText: {
        // justifyContent: 'center',
        // alignItems: 'center',
        backgroundColor: color.modal_back,
        paddingTop: 10,
        paddingBottom: 10,
        marginLeft: 2,
        paddingLeft: 10,
        flex: 1
    },
    smallText: {
        color: 'black',
        fontSize: 14,
        marginTop: 10
    },
    noneFoundText: {
        color: 'black',
        fontSize: 18,
        marginTop: 10
    },
    icon: {
        justifyContent: 'center',
        alignItems: 'center',
        // borderRadius: 50,
        width: 75,
        height: 100,
        // margin: 5,
        paddingTop: 10,
        paddingBottom: 10
    },
    modalStyle: {
        marginBottom: 50
    },
    deletePrintPanel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: "center",
        width: "100%",
        marginBottom: 5,
        marginTop: 5
    },
    orderPrintPanel: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: "center",
        width: "100%",
    },
    btn: {
        padding: 5,
        alignItems: 'center',
        borderColor: 'black',
        borderWidth: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        backgroundColor: color.btn_unselected,
        height: 35,
        borderRadius: 5,
        width: "49%"
    },
    btnHalf: {
		padding: 5,
		alignItems: 'center',
		borderColor: 'black',
		backgroundColor: 'white',
		justifyContent: 'center',
		backgroundColor: color.btn_unselected,
		height: 40,
		borderRadius: 5,
		width: "49%"
	},
	btnText: {
		fontSize: 15,
		color: 'black',
		textAlign: 'center'
	},
    btnSelected: {
        backgroundColor: color.btn_selected
    },
    headingCenter: {
        fontSize: 18, 
        color: 'black',
        marginTop: 10
    },
    textValue: {
        backgroundColor: color.light_grey,
        padding: 4,
        width: 125,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 2,
        marginRight: 0
    },
    defaultText: {
        color: 'black',
        fontSize: 15
    }
});

export default inventoryStyles;