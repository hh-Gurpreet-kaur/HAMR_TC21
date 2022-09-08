package com.hamr;


import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;


import java.util.ArrayList;
import java.util.Collections;
import java.util.List;


public class CustomToastPackage implements ReactPackage {

	@Override
	public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
		return Collections.emptyList();
	}

	@Override
	public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
		List<NativeModule> modules = new ArrayList<>();
		modules.add(new ToastModule(reactContext));
		modules.add(new ExportModule(reactContext));
		modules.add(new SmbModule(reactContext));
		modules.add(new Hamr.Logging(reactContext));
		return modules;
	}
}