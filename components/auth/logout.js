import React from "react";
import { View } from "react-native";
import { StackActions, NavigationActions } from "react-navigation";

export default class Logout extends React.Component {
  componentDidMount() {
    //Func to reset and navigate to Login screen
    const resetAction = StackActions.reset({
      index: 0,
      key: null,
      actions: [NavigationActions.navigate({ routeName: "Login" })],
    });
    this.props.navigation.dispatch(resetAction);
  }

  render() {
    return <View />;
  }
}
