import { StyleSheet } from 'react-native'
import color from './colors';

const modalStyles = StyleSheet.create({
    noDbModal: {
		padding: 0,
		paddingRight: 5,
		backgroundColor: color.modal_back,
		flexDirection: 'row',
	},
	modalText: {
		justifyContent: 'center',
		//alignItems: 'center',
		backgroundColor: color.modal_back,
		paddingTop: 10,
		paddingBottom: 10,
		marginLeft: 2,
		paddingLeft: 10,
		flex: 1
	},
	errorText: {
		fontSize: 22,
		color: 'black',
		fontWeight: 'bold'
	},
	smallText: {
		color: 'black',
		fontSize: 14,
	},
	largeText: {
		color: 'black',
		fontSize: 18
	},
    icon: {
		justifyContent: 'center',
		alignItems: 'center',
		// borderRadius: 50,
		width: 50,
		height: 100,
		// margin: 5,
		paddingTop: 10,
        paddingBottom: 10,
        marginLeft: 10
	},
	imgBox: {
		height: 150,
		backgroundColor: 'white',
		padding: 0,
		justifyContent: 'center',
		alignItems: 'center',
		width: "100%",
		flex: 1
	},
	img: { 
	   resizeMode: 'contain',
	   width: 150,
	   height: 150,
	},
	expandedImage: {
		position: 'absolute',
		left: 0,
		top: 0,
		padding: 0,
		margin: 0,
		width: "100%"
	}
});

export default modalStyles;