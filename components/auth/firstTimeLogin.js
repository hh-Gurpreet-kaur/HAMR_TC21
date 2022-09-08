import React from 'react'
import {
	View,
	Text,
	StyleSheet,
	Button,
	CheckBox,
	TouchableOpacity,
	Image,
    ImageBackground,
} from 'react-native'

import { translate } from '../../translations/langHelpers'
//import Analytics from '../../analytics/ga';

import sql from 'react-native-sqlite-storage'
let db


export default class FirstTimeLogin extends React.Component {
    constructor(props) {
		super(props)
		this.state = {

		}

    }

    componentDidMount () {
        //Analytics.trackScreenView('First Time Login');
        sql.openDatabase({
            name: config.dbName,
            location: config.dbPath,
        }, ()=>{}, ()=>{})
        .then((x) => {
            db = x
        })
    }

    onButtonPress = () => {
        this.props.navigation.navigate('Login');
    }

    
    render() {
        return (
            <View style={style.container}>
                <Image 
                    source={require('../../assets/img/thor.jpg')}
                    style={style.backImg}
                />

                <View style={style.header}>
                    <View style={style.headerIcon}>
                        <Image source={require('../../assets/img/hhIcon.png')} style={style.hhIcon}/>
                    </View>
                    <View style={style.headerText}>
                        <Text style={style.hamrText}> {translate("hamr")} </Text>
                    </View>
                </View>
                <View style={style.btnContainer}>
                    <TouchableOpacity style={style.btn} onPress={this.onButtonPress}>
                        <Text style={style.btnText}>{translate("first_time_login")}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}


const style = StyleSheet.create({
    container: {
		flex: 1,
		alignItems: 'center',
    },
    backImg: {
        height: "40%",
        width: "100%",

    },
    header: {
		// backgroundColor: 'grey',
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 35
	},
	headerIcon: {
		// height: 90,
		// width: 90,
		// backgroundColor: 'black',
		justifyContent: 'center',
		alignItems: 'center'
	},
	hhIcon: {
		resizeMode: 'contain',
		height: 75,
		width: 75,
		marginLeft: 13
	},
	headerText: {
		// backgroundColor: 'grey',
		justifyContent: 'center',
		alignItems: 'center'
	},
	hamrText: {
		fontFamily: 'HHAgendaBlack',
		fontSize: 70,
		color: 'black'
    },
    btnContainer: {
        marginTop: 15,
        width: "75%",
        height: 50,
    },
    btn: {
        height: "100%",
        width: "100%",
        backgroundColor: "#fcdf03",
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    btnText: {
        fontSize: 20,
        color: "black"
    }
});