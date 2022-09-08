import React from 'react';
import { View, Dimensions, StyleSheet, TouchableOpacity} from 'react-native';

import ModalFilterPicker from 'react-native-modal-filter-picker'


export default class FilterPicker extends React.Component {
    
    onSelect = (picked) => {
        this.props.onSelect(picked);
    }

    onCancel = () => {
        this.props.onCancel();
        console.log("ON CANCEL");
    }

    render() {
        const visible = this.props.visible;

        if (visible) {
            return (
                <ModalFilterPicker
                    visible={visible}
                    onSelect={this.onSelect}
                    onCancel={(this.onCancel)}
                    options={this.props.data}
                    placeholderText={this.props.placeholder}
                    overlayStyle={style.overlay}
                    listContainerStyle={style.listContainer}
                    optionTextStyle={style.optionTextStyle}
                    cancelContainerStyle={style.cancelContainerStyle}
                    filterTextInputContainerStyle={style.filterTextInputContainerStyle}
                    flatListViewProps={{style: style.flatListViewPropsStyle}}
                    modal={{ transparent: true }}
                    renderCancelButton={() => {
                        return(
                            <TouchableOpacity style={style.background} onPress={this.onCancel} />
                        )
                    }}
                />
            );
        }
        else {
            return(<View/>)
        }
    }

}

const { width, height } = Dimensions.get('window')
const pickerWidth = width * 0.95;

const style = StyleSheet.create({
    overlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
        backgroundColor: 'rgba(0,0,0,0)',
		justifyContent: 'center',
		alignItems: 'center'
	},
	listContainer: {
		flex: 1,
		justifyContent: 'flex-start',
		width: width,
        maxHeight: height,
		borderRadius: 0,
	},
	optionTextStyle: {
		flex: 1,
		textAlign: 'left',
		color: '#000',
		fontSize: 17
	},
	background: {
		flex: 1,
		justifyContent: 'flex-start',
		width: width - pickerWidth,
		maxHeight: height,
	},
	cancelContainerStyle: {
		position: 'absolute',
		top: 0,
		left: pickerWidth,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center'
	},
	filterTextInputContainerStyle: {
		borderBottomWidth: 1,
		borderBottomColor: '#999',
        width: pickerWidth,
        backgroundColor: "#fff",
        borderRightWidth: 0.5,
        borderRightColor: "#999"
	},
	flatListViewPropsStyle: {
        width: pickerWidth,
        backgroundColor: "#fff",
        borderRightWidth: 0.5,
        borderRightColor: "#999"
	}
});
