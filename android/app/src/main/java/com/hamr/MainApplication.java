package com.hamr;

//import com.hamr.generated.BasePackageList;
import android.app.Application;
import android.util.Log;


import com.facebook.react.PackageList;
import com.facebook.hermes.reactexecutor.HermesExecutorFactory;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
//import com.reactnativenavigation.NavigationApplication;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
//import com.reactnativenavigation.react.NavigationReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.github.kevinejohn.keyevent.KeyEventPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.ocetnik.timer.BackgroundTimerPackage;
import com.reactcommunity.rnlocalize.RNLocalizePackage;
import com.reactnativecommunity.netinfo.NetInfoPackage;
import com.rnfs.RNFSPackage;
import com.igorbelyayev.rnlocalresource.RNLocalResourcePackage;
import com.rusel.RCTBluetoothSerial.RCTBluetoothSerialPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;
import io.invertase.firebase.analytics.ReactNativeFirebaseAnalyticsPackage;
import com.mkuczera.RNReactNativeHapticFeedbackPackage;
import com.github.kevinejohn.keyevent.KeyEventPackage;

import org.pgsqlite.SQLitePluginPackage;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {
  // private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(new BasePackageList().getPackageList(), Arrays.<SingletonModule>asList());
 
   private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
     @Override
     public boolean getUseDeveloperSupport() {
       return BuildConfig.DEBUG;
     }

    @Override
    protected List<ReactPackage> getPackages() {
      List<ReactPackage> packages = Arrays.<ReactPackage>asList(
              new MainReactPackage(),
              new RCTBluetoothSerialPackage(),
              new RNLocalizePackage(),
              new BackgroundTimerPackage(),
              new RNFSPackage(),
              new NetInfoPackage(),
              new VectorIconsPackage(),
              new SQLitePluginPackage(),
              new RNGestureHandlerPackage(),
              new CustomToastPackage(),
              new ReactNativeFirebaseAppPackage(),
              new ReactNativeFirebaseAnalyticsPackage(),
              new RNLocalResourcePackage(),
              new RNReactNativeHapticFeedbackPackage(),
              new KeyEventPackage()
      );

      // Add unimodules
      /*List<ReactPackage> unimodules = Arrays.<ReactPackage>asList(
              new ModuleRegistryAdapter(mModuleRegistryProvider)
      );
      packages.addAll(unimodules);*/

      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
