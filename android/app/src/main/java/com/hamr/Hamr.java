package com.hamr;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import android.content.Context;
import java.io.OutputStreamWriter;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import static io.invertase.firebase.app.ReactNativeFirebaseApp.getApplicationContext;

public class Hamr {
    public static class Logging extends ReactContextBaseJavaModule {

        public Logging(ReactApplicationContext reactContext) {
            super(reactContext);
        }

        @Override
        public String getName() {
            return "Logging";
        }

        @ReactMethod
        public static void log(String message) {
            log(message, false);
        }


        private static void log(String message, boolean indent) {
            Context context = getApplicationContext();

            File logFile = new File(context.getExternalFilesDir(null), getFileName());


            if (!logFile.exists()){
                try{
                    logFile.createNewFile();
                }
                catch (IOException e){
                    e.printStackTrace();
                }
            }
            try{
                BufferedWriter buf = new BufferedWriter(new FileWriter(logFile, true));

                DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss.SSS");
                Date datetime = new Date();

                if (indent) {
                    buf.append(dateFormat.format(datetime) + "      " + message);
                    buf.newLine();
                }
                else {
                    buf.append(dateFormat.format(datetime) + "    " + message);
                }
                buf.newLine();
                buf.close();
            }
            catch (IOException e){
                e.printStackTrace();
            }
        }

        @ReactMethod
        public static void error(String errorTitle, String errorMessage) {
            log("ERROR - " + errorTitle);
            log(errorMessage, true);
        }


        private static String getFileName() {
            DateFormat dateFormat = new SimpleDateFormat("yyyyMMdd");
            Date date = new Date();

            String filename = "hamr_" + dateFormat.format(date) + ".log";

            return filename;
        }
    }

}
