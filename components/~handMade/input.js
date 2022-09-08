import React from 'react'
import {
  View,
  StyleSheet,
  TextInput
} from 'react-native'


export default class BoxInput extends React.Component {
  render() {
    return(
      <View style={style.box}>
        <TextInput
          style={style.input}
          placeholder={this.props.placeholder}
        />
      </View>
    )
  }
}

const style = StyleSheet.create({
  box: {
    margin: 5,
  },
  input: {
    borderWidth: 0.9
  }
})