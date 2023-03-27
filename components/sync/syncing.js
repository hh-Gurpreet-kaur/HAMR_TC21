import React from "react";
import { View } from "react-native";
import Sync from "../sync/sync";

export default class Syncing extends React.Component {
   constructor(props) {
    super(props)
} 
  componentDidMount() {
   //pasing showTheThing value on navigation 
    this.props.navigation.replace('Sync', {showTheThing : false});
  }

 
  render() {
    return <View />;
  }
}
