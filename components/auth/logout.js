import React from 'react'
import {View} from 'react-native'

export default class Logout extends React.Component {
    componentDidMount() {
        this.props.navigation.navigate('Login');
    }

    render() {
        return(
            <View />
        )
    }
}