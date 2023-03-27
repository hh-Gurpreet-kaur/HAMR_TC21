import React, { Component } from "react";
/* import { createStackNavigator } from "react-navigation-stack";
import { NavigationContainer, createAppContainer } from "react-navigation";
import { StyleSheet, I18nManager } from "react-native"; */
console.disableYellowBox = true;
console.ignoredYellowBox = ["Setting a timer", "Warning: Aysnc Storage"];
import "react-native-gesture-handler";
import * as RNLocalize from "react-native-localize";
import i18n from "i18n-js";
import memoize from "lodash.memoize";
import { setI18nConfig } from "./translations/langHelpers";
// ROOT NAV
import Nav from "./navigation/nav";
import config from "./config";
global.config = config;

// Translation helper functions

class App extends React.Component {
  constructor(props) {
    super(props);
    setI18nConfig();
  }

  componentDidMount() {
    RNLocalize.addEventListener("change", this.handleLocalizationChange);
  }

  componentWillUnmount() {
    RNLocalize.removeEventListener("change", this.handleLocalizationChange);
  }

  handleLocalizationChange = () => {
    setI18nConfig(); // set initial config before even rendering once
    this.forceUpdate();
  };

  render() {
    return <Nav />;
  }
}

// export default createAppContainer(nav)
export default App;
