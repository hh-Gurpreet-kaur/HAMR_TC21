// Main Navigation File

import React from "react";
//import { AsyncStorage } from 'react-native';
import { AsyncStorage } from "@react-native-async-storage/async-storage";
import { createSwitchNavigator } from "react-navigation";
import { createDrawerNavigator } from "react-navigation-drawer";
import { createStackNavigator } from "react-navigation-stack";
import { createAppContainer } from "react-navigation";
import UserInactivity from "react-native-user-inactivity";
import BackgroundTimer from "react-native-background-timer";
import KeyEvent from "react-native-keyevent";
import { translate } from "../translations/langHelpers";
import CustomDrawerItem from "../components/~handMade/drawerItem";
import Data from "../components/misc/nativeData";

// LOGIN
import Login from "../components/auth/userLogin";
import Loading from "../components/auth/loading";
import FirstTimeLogin from "../components/auth/firstTimeLogin";
import Logout from "../components/auth/logout";

// SEARCH + ORDER (Similar Flow)
import SearchMain from "../components/search/search";
import SearchResults from "../components/search/searchResults";
import ItemDetails from "../components/search/itemDetailsSearch";
import OrderScreen from "../components/search/order";
import ReviewOrder from "../components/search/searchReviewOrder";

// INVENTORY
import InventoryRouter from "../components/inventory/inventoryRouter";
import FullCount from "../components/inventory/fullCount";
import CycleCount from "../components/inventory/cycleCount";
import SpotCheck from "../components/inventory/spotCheck";
import ReviewFullCount from "../components/inventory/reviewFullCount";
import ReviewCycleCount from "../components/inventory/reviewCycleCount";
import ReviewSpotCheck from "../components/inventory/reviewSpotCheck";

// MARKET ORDER
import MarketOrderRouter from "../components/marketOrder/marketOrder";
import QuickEntry from "../components/marketOrder/quickEntry";
import DetailedEntry from "../components/marketOrder/itemDetails";
import ReviewMarketOrder from "../components/marketOrder/orderReviewMarketOrder";
import OrderInfo from "../components/marketOrder/orderInfo";

// SETTINGS
import SettingsRouter from "../components/settings/settingsRouter";
import PrintSettings from "../components/settings/printSettings";
import GeneralSettings from "../components/settings/generalSettings";

// SYNC
import Sync from "../components/sync/sync";
import Syncing from "../components/sync/syncing";

// MAIN HOME ROUTER
import Home from "../components/mainPage/home";
import color from "../styles/colors";

// ~~~~~~~~~~~~~~~~~~ STACK NAVIGATORS ~~~~~~~~~~~~~~~~~~~~~

const MarketStack = createStackNavigator(
  {
    MarketOrder: MarketOrderRouter,
    DetailedEntry_MarketOrder: DetailedEntry,
    QuickEntry_MarketOrder: QuickEntry,
    ReviewMarketOrder: ReviewMarketOrder,
    OrderInfo: OrderInfo,
  },
  {
    headerMode: "none",
  }
);

const InventoryStack = createStackNavigator(
  {
    Inventory: InventoryRouter,
    FullCount_Inventory: FullCount,
    CycleCount_Inventory: CycleCount,
    SpotCheck_Inventory: SpotCheck,
    ReviewFullCount: ReviewFullCount,
    ReviewCycleCount: ReviewCycleCount,
    ReviewSpotCheck: ReviewSpotCheck,
  },
  {
    headerMode: "none",
  }
);

const SearchStack = createStackNavigator(
  {
    Search: SearchMain,
    SearchResults: SearchResults,
    ItemDetails: ItemDetails,
    OrderScreen: OrderScreen,
    ReviewOrder: ReviewOrder,
  },
  {
    headerMode: "none",
  }
);

const OrderStack = createStackNavigator(
  {
    OrderScreen: OrderScreen,
    ReviewOrder: ReviewOrder,
    ItemDetails: ItemDetails,
  },
  {
    headerMode: "none",
  }
);

const SettingsStack = createStackNavigator(
  {
    Settings: SettingsRouter,
    GeneralSettings_Settings: GeneralSettings,
    PrintSettings_Settings: PrintSettings,
    Syncs: Sync,
  },
  {
    headerMode: "none",
  }
);

 const SyncStack = createStackNavigator(
  {Syncing: Syncing,
   Sync: Sync,
  },
  {
    headerMode: "none",
  }
); 

// ~~~~~~~~~~~~~~~~~~DRAWER STACK~~~~~~~~~~~~~~~~~~~~~

// create drawer nav
const mainNav = createDrawerNavigator(
  {
    // Main - Router Homepage
    Home: {
      screen: Home,
      navigationOptions: ({ navigation }) => {
        return {
          drawerLabel: () => (
            <CustomDrawerItem
              title={translate("main")}
              icon={"selection"}
              isItemVisible={true}
              navigation={navigation}
              route={"Home"}
            />
          ),
          headerStyle: {
            backgroundColor: "red",
          },
        };
      },
    },

    // Search Route
    Search: {
      screen: SearchStack,
      navigationOptions: ({ navigation }) => {
        return {
          drawerLabel: () => (
            <CustomDrawerItem
              title={translate("search")}
              icon={"magnify"}
              color={"#f2e529"}
              iconColor={"black"}
              isItemVisible={true}
              navigation={navigation}
              route={"Search"}
            />
          ),
        };
      },
    },

    Order: {
      screen: OrderStack,
      navigationOptions: ({ navigation }) => {
        return {
          drawerLabel: () => (
            <CustomDrawerItem
              title={translate("order")}
              icon={"cart"}
              color={"#0424d9"}
              isItemVisible={global.securityLevel >= 4}
              navigation={navigation}
              route={"Order"}
            />
          ),
        };
      },
    },

    // Market Order Routes
    // Visible : [MarketOrder]
    MarketOrder: {
      screen: MarketStack,
      navigationOptions: ({ navigation }) => {
        return {
          drawerLabel: () => (
            <CustomDrawerItem
              title={translate("market_order")}
              icon={"store"}
              color={color.btn_selected}
              isItemVisible={global.securityLevel >= 4}
              navigation={navigation}
              route={"MarketOrder"}
            />
          ),
        };
      },
    },

    // Inventory Routes
    Inventory: {
      screen: InventoryStack,
      navigationOptions: ({ navigation }) => {
        return {
          drawerLabel: () => (
            <CustomDrawerItem
              title={translate("inventory")}
              icon={"format-list-numbered"}
              color={color.light_green}
              isItemVisible={global.securityLevel >= 3}
              navigation={navigation}
              route={"Inventory"}
            />
          ),
        };
      },
    },

    // Setting Routes
    Settings: {
      screen: SettingsStack,
      navigationOptions: ({ navigation }) => {
        return {
          drawerLabel: () => (
            <CustomDrawerItem
              title={translate("settings")}
              icon={"cog"}
              color={"#f2561d"}
              isItemVisible={global.securityLevel >= 5}
              navigation={navigation}
              route={"Settings"}
            />
          ),
        };
      },
    },

    // Sync Routes
    Sync: {
      screen: SyncStack,
      navigationOptions: ({ navigation }) => {
        return {
          drawerLabel: () => (
            <CustomDrawerItem
              title={translate("sync")}
              icon={"folder-sync"}
              color={"#f2561d"}
              isItemVisible={true}
              navigation={navigation}
              route={"Sync"}
            />
          ),
        };
      },
    },  

    // Logout Routes
    Logout: {
      screen: Logout,
      navigationOptions: ({ navigation }) => {
        return {
          drawerLabel: () => (
            <CustomDrawerItem
              title={translate("logout")}
              icon={"exit-run"}
              color={color.pink}
              isItemVisible={true}
              navigation={navigation}
              route={"Logout"}
            />
          ),
        };
      },
    },
  },
  {
    intialRouteName: "Home",
  }
);

// ~~~~~~~~~~~~~~~~~~~MAIN STACK + AUTH~~~~~~~~~~~~~~~~~~~

const FirstTimeLoginStack = createStackNavigator(
  {
    FirstTimeLogin: FirstTimeLogin,
  },
  {
    headerMode: "none",
  }
);

const DataStack = createStackNavigator(
  {
    Data: Data,
  },
  {
    headerMode: "none",
  }
);

const AuthStack = createStackNavigator(
  {
    Login: Login,
    Router: mainNav,
  },
  {
    headerMode: "none",
  }
);

const NAVIGATE_ACTION = "Navigation/NAVIGATE";
const TOGGLE_DRAWER_ACTION = "Navigation/TOGGLE_DRAWER";
const KEYCODE_SCAN = 59;
const DEFAULT_TIMEOUT = 10 * 1000 * 60;

// Custom navigator to handle auto logout capabilities
class CustomNavigator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      timeout: null,
      timeoutEnabled: false,
    };
  }

  componentDidMount() {
    global.shouldNavigate = true;
  }

  componentDidUpdate() {
    if (global.updateTimeout) {
      this.getTimeout();
      global.updateTimeout = false;
    }
  }

  static router = {
    ...AuthStack.router,
    getStateForAction: (action, lastState) => {
      const defaultResult = AuthStack.router.getStateForAction(
        action,
        lastState
      );

      // This stops the navigation drawer from opening while scanning
      if (
        (action.type == NAVIGATE_ACTION ||
          action.type == TOGGLE_DRAWER_ACTION) &&
        action.routeName != "Router"
      ) {
        if (!global.shouldNavigate) {
          global.shouldNavigate = true;
          return lastState;
        } else {
          return defaultResult;
        }
      } else {
        return defaultResult;
      }
    },
  };

  async onAction(isActive) {
    await this.getTimeout();

    if (this.state.timeoutEnabled && !isActive && this.state.timeout != 0) {
      this.props.navigation.navigate("Login");
    }
  }

  async getTimeout() {
    let timeoutEnabled = await AsyncStorage.getItem("timeoutEnabled");
    let tempTimeout = await AsyncStorage.getItem("timeout");

    if (timeoutEnabled == "true") {
      this.state.timeoutEnabled = true;
    } else if (timeoutEnabled == "false") {
      this.state.timeoutEnabled = false;
    }

    if (tempTimeout == null) {
      this.setState({
        timeout: DEFAULT_TIMEOUT,
      });
    } else if (tempTimeout != this.state.timeout) {
      let numValue = Number(tempTimeout);
      this.setState({
        timeout: numValue * 1000 * 60,
      });
    }
  }

  render() {
    const { navigation } = this.props;

    return (
      <UserInactivity
        timeForInactivity={this.state.timeout}
        timeoutHandler={BackgroundTimer}
        onAction={(isActive) => {
          this.onAction(isActive);
        }}
      >
        <AuthStack navigation={navigation} />
      </UserInactivity>
    );
  }
}

// export default Loading
export default createAppContainer(
  createSwitchNavigator(
    {
      AuthLoading: Loading,
      App: CustomNavigator,
      Data: DataStack,
      FirstTimeLogin: FirstTimeLoginStack,
    },
    {
      initialRouteName: "AuthLoading",
    }
  )
);
// export default ReviewOrder
