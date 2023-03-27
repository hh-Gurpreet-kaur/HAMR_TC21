import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Button,
  PermissionsAndroid
  , NativeModules
} from 'react-native'

import { Item } from '../mainPage/home'

import addHeader from '../../hoc/addHeader'
import { translate } from '../../translations/langHelpers'
import color from '../../styles/colors'
import RNFS from 'react-native-fs'

const Logging = NativeModules.Logging

class MarketOrderRouter extends React.Component {
  
  render () {
    return (
      <View style={style.container}>
        <Item
          title={translate('market_order_title')}
          body={translate('detailed_entry_desc')}
          icon={'package-variant'}
          iconColor={color.btn_selected}
          onPress={() =>
            this.props.navigation.navigate('DetailedEntry_MarketOrder')
          }
        />

        <Item
          title={translate('quick_entry_title')}
          body={translate('quick_entry_desc')}
          icon={'home-city-outline'}
          iconColor={color.btn_selected}
          onPress={() =>
            this.props.navigation.navigate('QuickEntry_MarketOrder')
          }
        />
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    padding: 2,
    backgroundColor: 'white',
    flex: 1
  }
})
export default addHeader(MarketOrderRouter, 'market_order')
