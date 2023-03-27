import React from 'react'
import {
  View,
  Image,
  StyleSheet,
  Text,
  Button,
  TouchableNativeFeedback
} from 'react-native'

import { BarIndicator } from 'react-native-indicators'

import Modal from 'react-native-modal'
import RNFS from 'react-native-fs'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import sql from 'react-native-sqlite-storage'
import color from '../../styles/colors'
import Settings from '../settings/settings'

export default class LoadingPage extends React.Component {
  constructor (props) {
    super(props)
  }

  componentDidMount () {
    console.log(config.dbPath + config.dbName)
    Settings.loadSettings()
    RNFS.exists(config.dbPath + config.dbName).then((exists) => {
      // db file exists
      if (exists) {
        // attempt to open db
        sql
          .openDatabase(
            {
              name: config.dbName,
              location: config.dbPath
            },
            () => {},
            () => {}
          )
          .then((db) => {
            // query settings table to check if exists
            db.executeSql('SELECT * FROM Settings')
              .then(() => {
                this.props.navigation.navigate('App')
              })
              .catch(() => {
                this.props.navigation.navigate('Data')
              })
          })
      } else {
        this.props.navigation.navigate('Data')
      }
    })
  }

  render () {
    return (
      <View style={style.container}>
        <View style={style.animationBox}>
          <BarIndicator color={color.heading} size={100} count={5} />
        </View>
        <View style={style.imgBox}>
          <Image
            source={require('../../assets/img/loading.png')}
            style={style.hhImage}
          />
        </View>
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row'
    // backgroundColor: 'red'
  },
  animationBox: {
    // flex: 1,
    width: 290,
    // backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'center'
  },
  imgBox: {
    flex: 1,
    // width: 300,
    backgroundColor: 'grey'
  },
  hhImage: {
    width: 120,
    height: 800
  },
  noDbModal: {
    padding: 0,
    backgroundColor: 'white',
    flexDirection: 'row'
    // justifyContent: 'space-between',
  },
  modalText: {
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: color.heading,
    paddingTop: 10,
    paddingBottom: 10,
    marginLeft: 2,
    paddingLeft: 10,
    flex: 1
  },
  errorText: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold'
  },
  smallText: {
    color: 'white',
    fontSize: 18
  },
  icon: {
    backgroundColor: color.pink,
    justifyContent: 'center',
    alignItems: 'center',
    // borderRadius: 50,
    width: 100,
    height: 100,
    // margin: 5,
    paddingTop: 10,
    paddingBottom: 10
  }
})
