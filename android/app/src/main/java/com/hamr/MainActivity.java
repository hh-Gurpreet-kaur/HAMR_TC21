package com.hamr;

import android.os.Bundle;  // required for onCreate parameter
import com.facebook.react.ReactActivity;
//import com.reactnativenavigation.NavigationActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;
import android.view.KeyEvent;
import com.github.kevinejohn.keyevent.KeyEventModule;
import com.rusel.RCTBluetoothSerial.*;
//import kotlinx.android.synthetic.main.activity_main.*;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "hamr";
    }

    

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName()) {
            @Override
            protected ReactRootView createRootView() {
                return new RNGestureHandlerEnabledRootView(MainActivity.this);
            }
        };
    }



    @Override 
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        KeyEventModule.getInstance().onKeyUpEvent(keyCode, event);

        super.onKeyUp(keyCode, event);
        return true;
    }

   @Override
    protected void onCreate(Bundle savedInstanceState) {
      super.onCreate(null);
    }


}
