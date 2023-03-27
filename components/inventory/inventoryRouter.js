import React from 'react'
import { View, Text, StyleSheet, Button, FlatList } from 'react-native'

import { withNavigation } from 'react-navigation'

import addHeader from '../../hoc/addHeader'
import { translate } from '../../translations/langHelpers'

import { Item } from '../mainPage/home'

import sql from 'react-native-sqlite-storage'
import color from '../../styles/colors'

let db

// STEP BASED router menu

class InventoryRouter extends React.Component {
  static navigationOptions = {
    title: 'Router',
    headerRight: (
      <Button
        onPress={() => this.props.navigation.toggleDrawer()}
        title="Info"
        color="#fff"
      />
    )
  }

  constructor (props) {
    super(props)
    this.state = {
      currType: '',
      routeData: [
        {
          key: translate('full_count_title'),
          description: translate('full_count_desc'),
          icon: 'shopping-basket',
          iconLib: 'FontAwesome'
        },
        {
          key: translate('cycle_count_title'),
          description: translate('cycle_count_desc'),
          icon: 'box',
          iconLib: 'Feather'
        },
        {
          key: translate('spot_check_title'),
          description: translate('spot_check_desc'),
          icon: 'fire'
        }
      ]
    }
  }

  componentDidMount () {
    sql
      .openDatabase(
        {
          name: config.dbName,
          location: config.dbPath
        },
        () => {},
        () => {}
      )
      .then((x) => {
        db = x
        this.getCounts()
        this.focusListener = this.props.navigation.addListener(
          'didFocus',
          this.getCounts
        )
      })
  }

  componentWillUnmount () {
    this.focusListener.remove()
  }

  getCounts = () => {
    const qFull = 'SELECT COUNT(*) as Count FROM InventoryCount WHERE Tag IS NOT NULL AND Location IS NULL'
    const qCycle = 'SELECT COUNT(*) as Count from InventoryCount WHERE Tag IS NULL AND Location IS NOT NULL'
    const qSpot = 'SELECT COUNT(*) as Count FROM InventoryCount WHERE Tag IS NULL AND Location IS NULL'
    db.transaction((tx) => {
      tx.executeSql(qFull, [], (tx, res) => {
        if (res.rows.item(0).Count > 0) {
          this.setState({ currType: 'full' })
        } else {
          tx.executeSql(qCycle, [], (tx, res) => {
            if (res.rows.item(0).Count > 0) {
              this.setState({ currType: 'cycle' })
            } else {
              tx.executeSql(qSpot, [], (tx, res) => {
                if (res.rows.item(0).Count > 0) {
                  this.setState({ currType: 'spot' })
                } else {
                  this.setState({ currType: '' })
                }
              })
            }
          })
        }
      })
    })
  }

  renderCycleCount (item) {
    if (global.isThirdParty) {
      if (this.state.currType == '' || this.state.currType == 'cycle') {
        return (
          <Item
            title={item[1].key}
            body={item[1].description}
            icon={item[1].icon}
            iconLib={item[1].iconLib}
            onPress={() =>
              this.props.navigation.navigate('CycleCount_Inventory')
            }
          />
        )
      } else {
        return (
          <Item
            title={item[1].key}
            body={item[1].description}
            icon={item[1].icon}
            iconLib={item[1].iconLib}
            iconColor={'#608060'}
            back={'lightgrey'}
            disabled={true}
            onPress={() => alert(translate('count_in_progress'))}
          />
        )
      }
    }
  }

  renderFullCount (item) {
    if (this.state.currType == '' || this.state.currType == 'full') {
      return (
        <Item
          title={item[0].key}
          body={item[0].description}
          icon={item[0].icon}
          iconLib={item[0].iconLib}
          onPress={() => this.props.navigation.navigate('FullCount_Inventory')}
        />
      )
    } else {
      return (
        <Item
          title={item[0].key}
          body={item[0].description}
          icon={item[0].icon}
          iconLib={item[0].iconLib}
          iconColor={'#608060'}
          back={'lightgrey'}
          disabled={true}
          onPress={() => alert(translate('count_in_progress'))}
        />
      )
    }
  }

  renderSpotCheck (item) {
    if (this.state.currType == '' || this.state.currType == 'spot') {
      return (
        <Item
          title={item[2].key}
          body={item[2].description}
          icon={item[2].icon}
          iconLib={item[2].iconLib}
          onPress={() => this.props.navigation.navigate('SpotCheck_Inventory')}
        />
      )
    } else {
      return (
        <Item
          title={item[2].key}
          body={item[2].description}
          icon={item[2].icon}
          iconLib={item[2].iconLib}
          iconColor={'#608060'}
          back={'lightgrey'}
          disabled={true}
          onPress={() => alert(translate('count_in_progress'))}
        />
      )
    }
  }

  render () {
    const item = this.state.routeData
    return (
      <View style={style.container}>
        {this.renderFullCount(item)}
        {this.renderCycleCount(item)}
        {this.renderSpotCheck(item)}
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    padding: 3,
    backgroundColor: 'white'
  }
})

export default addHeader(InventoryRouter, 'inventory')
