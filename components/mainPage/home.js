/*
	Home Component which acts as the router
*/
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  Button,
  TouchableWithoutFeedback,
} from "react-native";

import IconMC from "react-native-vector-icons/MaterialCommunityIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Feather from "react-native-vector-icons/Feather";
import addHeader from "../../hoc/addHeader";
import { translate } from "../../translations/langHelpers";
import color from "../../styles/colors";

import Analytics from "../../analytics/ga";

class Home extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      routeData: [
        {
          key: translate("search"),
          description: translate("search_desc"),
          icon: "magnify",
          color: "black",
          iconColor: "#f2e529",
        },
        {
          key: translate("order"),
          description: translate("order_desc"),
          icon: "cart",
          iconColor: "#0424d9",
        },
        {
          key: translate("market_order"),
          description: translate("market_order_desc"),
          icon: "store",
          iconColor: color.btn_selected,
        },
        {
          key: translate("inventory"),
          description: translate("inventory_desc"),
          icon: "format-list-numbered",
          iconColor: color.light_green,
        },
        {
          key: translate("settings"),
          description: translate("settings_desc"),
          icon: "cog",
          iconColor: "#f2561d",
        },

         {
          key:translate ("sync"),
          description: translate("syncb_desc"),
          icon: "folder-sync",
          iconColor: "#f2561d",
        //  onPress: this.props.navigation.navigate('Sync')
        },  
        
        {
          key: translate("logout"),
          description: translate("logout_desc"),
          icon: "exit-run",
          iconColor: color.pink,
          // onPress: this.props.navigation.navigate('Search')
        },
      ],
    };
  }

  componentDidMount() {
    Analytics.trackScreenView("Home");
  }

  renderInventory() {
    if (global.securityLevel >= 3) {
      return (
        <Item
          title={this.state.routeData[3].key}
          body={this.state.routeData[3].description}
          icon={this.state.routeData[3].icon}
          iconColor={this.state.routeData[3].iconColor}
          onPress={() => this.props.navigation.navigate("Inventory")}
        />
      );
    }
  }

  renderOrdering() {
    if (global.securityLevel >= 4) {
      return (
        <View>
          <Item
            title={this.state.routeData[1].key}
            body={this.state.routeData[1].description}
            icon={this.state.routeData[1].icon}
            iconColor={this.state.routeData[1].iconColor}
            onPress={() => this.props.navigation.navigate("Order")}
          />

          <Item
            title={this.state.routeData[2].key}
            body={this.state.routeData[2].description}
            icon={this.state.routeData[2].icon}
            iconColor={this.state.routeData[2].iconColor}
            onPress={() => this.props.navigation.navigate("MarketOrder")}
          />
        </View>
      );
    }
  }

  renderSettings() {
    if (global.securityLevel >= 5) {
      return (
        <Item
          title={this.state.routeData[4].key}
          body={this.state.routeData[4].description}
          icon={this.state.routeData[4].icon}
          iconColor={this.state.routeData[4].iconColor}
          onPress={() => this.props.navigation.navigate("Settings")}
        />
      );
    }
  }

  render() {
    return (
      <ScrollView style={style.container}>
        <Item
          title={this.state.routeData[0].key}
          body={this.state.routeData[0].description}
          icon={this.state.routeData[0].icon}
          iconColor={this.state.routeData[0].iconColor}
          color={this.state.routeData[0].color}
          onPress={() => this.props.navigation.navigate("Search")}
        />

        {this.renderOrdering()}

        {this.renderInventory()}

        {this.renderSettings()}

         <Item
          title={this.state.routeData[5].key}
          body={this.state.routeData[5].description}
          icon={this.state.routeData[5].icon}
          iconColor={this.state.routeData[5].iconColor}
          onPress={() => this.props.navigation.navigate("Sync")}
        />  

        <Item
          title={this.state.routeData[6].key}
          body={this.state.routeData[6].description}
          icon={this.state.routeData[6].icon}
          iconColor={this.state.routeData[6].iconColor}
          onPress={() => this.props.navigation.navigate("Logout")}
        />
      </ScrollView>
    );
  }
}

export default addHeader(Home, "welcome");

// Single Item Design
export class Item extends React.Component {
  constructor(props) {
    super(props);
  }

  renderIcon() {
    const color = this.props.color || "white";
    if (this.props.iconLib == "FontAwesome") {
      return <FontAwesome name={this.props.icon} size={17} color={color} />;
    } else if (this.props.iconLib == "Feather") {
      return <Feather name={this.props.icon} size={27} color={color} />;
    } else {
      return <IconMC name={this.props.icon} size={22} color={color} />;
    }
  }

  render() {
    const back = this.props.back || "white";
    const iconColor = this.props.iconColor || "green";
    if (this.props.body) {
      if (this.props.disabled) {
        return (
          <TouchableWithoutFeedback onPress={this.props.onPress}>
            <View
              style={[
                style.outerLi,
                this.backCircle,
                { backgroundColor: back },
              ]}
            >
              <View style={[style.iconLi, { backgroundColor: iconColor }]}>
                {this.renderIcon()}
              </View>

              <View style={style.textLi}>
                <View style={style.title}>
                  <Text style={[style.titleLi, { color: "grey" }]}>
                    {this.props.title}
                  </Text>
                </View>
                <View style={style.subtitle}>
                  <Text style={[style.bodyLi, { color: "grey" }]}>
                    {this.props.body}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        );
      } else {
        return (
          <TouchableNativeFeedback
            onPress={this.props.onPress}
            background={TouchableNativeFeedback.Ripple("#afabab")}
          >
            <View
              style={[
                style.outerLi,
                this.backCircle,
                { backgroundColor: back },
              ]}
            >
              <View style={[style.iconLi, { backgroundColor: iconColor }]}>
                {this.renderIcon()}
              </View>

              <View style={style.textLi}>
                <View style={style.title}>
                  <Text style={style.titleLi}>{this.props.title}</Text>
                </View>
                <View style={style.subtitle}>
                  <Text style={style.bodyLi}>{this.props.body}</Text>
                </View>
              </View>
            </View>
          </TouchableNativeFeedback>
        );
      }
    } else {
      return (
        <TouchableNativeFeedback
          onPress={this.props.onPress}
          background={TouchableNativeFeedback.Ripple("#afabab")}
        >
          <View
            style={[style.outerLi, this.backCircle, { backgroundColor: back }]}
          >
            <View style={style.textCentered}>
              <View style={style.title}>
                <Text style={style.titleLi}>{this.props.title}</Text>
              </View>
            </View>
          </View>
        </TouchableNativeFeedback>
      );
    }
  }
}

const style = StyleSheet.create({
  container: {
    margin: 0,
    width: "100%",
  },
  outerLi: {
    flexDirection: "row",
    marginBottom: 2,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  iconLi: {
    // padding: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
    // marginRight: 5,
    width: 40,
    height: 40,
    borderRadius: 50,
  },
  textLi: {
    // backgroundColor: 'grey',
    marginLeft: 7,
    marginRight: 5,
    flex: 1,
  },
  textCentered: {
    marginLeft: 7,
    marginRight: 5,
    flex: 1,
    alignItems: "center",
  },
  titleLi: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  bodyLi: {
    flexWrap: "wrap",
    color: "black",
    fontSize: 13,
    marginLeft: 5,
  },
  subtitle: {
    // paddingLeft: 2,
  },
});
