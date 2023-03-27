import React from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity
} from 'react-native'

import { translate } from '../../translations/langHelpers'
import Modal from 'react-native-modal'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import color from "../../styles/colors";

export default class OrderModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isDeleteModalVisible: false
        }
    }

    hideModal = () => {
        this.props.onHide();
        
    }

    onDeleteRow = () => {
        this.props.onDeleteRow();
    }

    render() {
        return (
            <Modal isVisible={this.props.visible} onBackdropPress={this.hideModal} >
                <View  style={style.noDbModal}>
                    <View style={style.icon} >
                        <Icon name={'alert-circle'} size={50} color={color.modal_red} />
                    </View>
                    <View style={style.modalText}>
                        <Text style={style.errorText}>{translate('delete_line_title')}</Text>
                        <Text style={style.smallText}>{this.props.prompt}</Text>
                        <View style={{flexDirection: "row", borderTopWidth: 1, justifyContent: "space-between", width: "85%", marginTop: 10, paddingTop: 10}}>
                            <TouchableOpacity style={{flexDirection: "row", alignItems: "center"}} onPress={this.onDeleteRow}>
                                <Icon name={'cart'} size={25} color={color.modal_red} />
                                <Text style={{color: color.modal_red}}>{translate("order")}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{flexDirection: "row", alignItems: "center"}} onPress={this.hideModal}>
                                <Icon name={'keyboard-backspace'} size={25} color={'green'} />
                                <Text style={{color: color.modal_green}}>{translate("go_back")}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }
}



const style = StyleSheet.create({
	noDbModal: {
		padding: 0,
		backgroundColor: 'white',
		flexDirection: 'row',
	},
	modalText: {
		backgroundColor: 'white',
		paddingTop: 10,
		paddingBottom: 10,
		marginLeft: 2,
		paddingLeft: 5,
		paddingRight: 3,
		flex: 1,
	},
	errorText: {
		fontSize: 18,
		color: 'black',
	},
	smallText: {
		color: 'black',
		fontSize: 14,
	},
	icon: {
		justifyContent: 'center',
		alignItems: 'center',
		width: 65,
		height: 100,
		paddingTop: 10,
		paddingBottom: 10
	},
})