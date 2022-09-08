import * as React from 'react';
import { StyleSheet, I18nManager } from 'react-native';
//import { createStackNavigator, createAppContainer } from 'react-navigation';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
console.disableYellowBox = true;
console.ignoredYellowBox = ['Setting a timer', 'Warning: Aysnc Storage'];

import * as RNLocalize from "react-native-localize";
import i18n from "i18n-js";
import memoize from "lodash.memoize";
import { setI18nConfig } from './translations/langHelpers';

// ROOT NAV
import Nav from './navigation/nav';

import config from './config';
global.config = config;

const Stack = createStackNavigator();
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
		setI18nConfig();
		this.forceUpdate();
	  };

	render() {
		return (
			<Nav />
		)
	}
}


// export default createAppContainer(nav)
export default App