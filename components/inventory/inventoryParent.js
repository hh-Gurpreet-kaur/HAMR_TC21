import React from 'react'
import { View, Text, StyleSheet, Button } from 'react-native'

// import {createStackNavigator, createAppContainer} from 'react-navigation'
import { createStackNavigator } from 'react-navigation-stack'
import { createAppContainer } from 'react-navigation'

import InventoryRouter from './inventoryRouter'
import FullCount from './fullCount'
import CycleCount from './cycleCount'
import SpotCheck from './spotCheck'

const inventoryNav = createStackNavigator(
  {
    Route: InventoryRouter,
    FullCount,
    CycleCount,
    SpotCheck
  },
  {
    initialRouteName: 'Route'
  }
)

export default createAppContainer(inventoryNav)
