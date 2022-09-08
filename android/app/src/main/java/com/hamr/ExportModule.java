// HAMR Export Utilities

package com.hamr;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.util.Log;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Date;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;

import static io.invertase.firebase.app.ReactNativeFirebaseApp.getApplicationContext;

public class ExportModule extends ReactContextBaseJavaModule {

    public static SQLiteDatabase db;

    // ctor
    public ExportModule(ReactApplicationContext ctx) {
        super(ctx);


    }

    @Override
    public String getName() {
        return "ExportModule";
    }

    public void exportOrder() {
        /*
            For every order in order table, corresponding line should be (in mdorder.dat)
            sku|deal number|customer number|quantity|quantity correct

            Database Order (when pulling from cursor)
            0 > OrderID [no use]
            1 -> SkuNum,
            2 -> Qty,
            3 -> QtyCorrect
            4 -> Customer Num
            5 -> DealNum
            6 -> StoreNum

            Abstraction Idea
            1. send 1D matrix of string indexes,
            2. get back corresponding line for every row
         */

        Hamr.Logging.log("Generating mdorder.dat");

        // create storage for string
        StringBuffer store = new StringBuffer();

        // create query and index array
        String query = new String("SELECT * FROM [Order]");
        int[] pattern = {1, 5, 4, 2, 3};

        // make query call
        Cursor res = db.rawQuery(query, null);
        res.moveToFirst();


        int cols = res.getColumnCount();
        int rows = res.getCount();
        int need = pattern.length;

        if (rows > 0) {

            for (int r = 0; r < rows; r++) {
                String ans = "";

                // iterate over each row
                // for the indexes in pattern
                for (int c = 0; c < need; c++) {
                    // get index
                    int n = pattern[c];
                    String s = res.getString(n);


                    // PLACE ALL CHECKS + VALIDATIONS HERE
                    // null check
                    if (s == null) {
                        s = "";
                    }

                    // boolean check
                    if (c == need - 1) {
                        s = (s.equals("1") ? "Y" : "N");
                    }


                    // main string construction
                    ans = ans + s;

                    if (c != need - 1) {
                        ans += "|";
                    }
                }
                // store processed
                store.append(ans);
                store.append("\n");


                res.moveToNext();
            }

            // print contents
            p("Writing to mdorder.dat");
            p(store.toString());


            // send store to pipeline which writes into
            writeToFile(store, "/mdorder.dat");
        }
        else {
            Hamr.Logging.log("No orders to export");
        }

        // close cursor
        res.close();
    }



    public void writeToFile(StringBuffer s, String filename) {
        /*
        This method receives the contents of the mdorder.dat file
        as a parameter, then write into file
         */

        File f = new File(getReactApplicationContext().getFilesDir() + filename);

        if (f.isFile()) {
            // overwrite
            try {
                FileOutputStream out = new FileOutputStream(f);
                out.write(s.toString().getBytes());
                out.close();
                Hamr.Logging.log("Finished");
            } catch (IOException e) {
                p("Writing to already existing " + filename +" THREW \n");
                p(e.toString());
                Hamr.Logging.error("Error writing to " + filename, e.getMessage());
                return;
            }


        } else {
            // create file and write
            try {
                Boolean fileMade = f.createNewFile();
                if (!fileMade) {
                    return;
                }

                // create output stream and write string buffer to it
                FileOutputStream out = new FileOutputStream(f);
                out.write(s.toString().getBytes());
                out.close();
                Hamr.Logging.log("Finished");
                Hamr.Logging.log("Wrote: " + getReactApplicationContext().getFilesDir() + filename);
            } catch(IOException e) {
                p("Creating new " + filename + "THREW \n");
                p(e.toString());
                Hamr.Logging.error("Error writing to " + filename, e.getMessage());
                return;
            }


        }


    }

    public void exportMarket() {
        /*
            For every order in order table, corresponding line should be (in mdmarket.dat)
            item|deal|consumer#|qty|qty correct|selected

            Database Signature (indexes for cursor)
            0 -> Order ID
            1 -> SkuNum
            2 -> Qty
            3 -> StoreNum
            4 -> Selected

         */

        //This is just a placeholder. The actual deal number is attached by HomeInfo.
        String defaultDeal = "9300";

        Hamr.Logging.log("Generating mdmarket.dat");

        // create state
        StringBuffer store = new StringBuffer();
        String query = new String("SELECT ifnull(MarketOrder.SkuNum,0), " +
                "ifnull(MarketOrder.Qty,1), " +
                "ifnull(MarketOrder.Selected,0) "+
                "FROM MarketOrder");

        Cursor res = db.rawQuery(query, null);
        res.moveToFirst();

        int rows = res.getCount();

        if (rows > 0) {

            for (int r = 0; r < rows; r++) {
                String ans = "";

                ans += res.getString(0) + "|";
                ans += defaultDeal + "|";
                ans += "|";
                ans += res.getString(1) + "|";
                ans += "Y|";
                ans += res.getInt(2) > 0 ? "Y" : "N";

                // store processed
                store.append(ans);
                store.append("\n");

                res.moveToNext();
            }

            // print contents
            p("Writing to mdmarket.dat");
            p(store.toString());


            // send store to pipeline which writes into
            writeToFile(store, "/mdmarket.dat");
        }
        else {
            Hamr.Logging.log("No market orders to export.");
        }

        // close cursor
        res.close();
    }


    public void exportInventory() {

        Hamr.Logging.log("Generating mdinventory.dat");

        // create state
        StringBuffer store = new StringBuffer();
        String query = new String("SELECT " +
                "ifnull(SkuNum, ''), UpcCode" +
                ",Qty, ifnull(Location, '')" +
                ",Employee.Login, ifnull(Tag, '')" +
                " FROM InventoryCount" +
                " LEFT JOIN Employee ON InventoryCount.EmployeeID = Employee.EmployeeID");

        Cursor res = db.rawQuery(query, null);
        res.moveToFirst();

        int rows = res.getCount();

        if (rows > 0) {

            for (int r = 0; r < rows; r++) {
                String ans = "";
                String sku = res.getString(0);

                ans += (sku.equals("") ? res.getString(1) : sku) + "|";
                ans += res.getString(2) + "|";
                ans += res.getString(3) + "||";
                ans += res.getString(4) + "|";
                ans += res.getString(5);

                // store processed
                store.append(ans);
                store.append("\n");

                res.moveToNext();
            }

            // print contents
            p("Writing to mdinventory.dat");
            p(store.toString());


            // send store to pipeline which writes into
            writeToFile(store, "/mdinventory.dat");
        }
        else {
            Hamr.Logging.log("No inventory to export.");
        }

        // close cursor
        res.close();
    }



    @ReactMethod
    public void export() {
        // this function is responsible for generating the export
        // flat files related to the SYNC

        // init database
        File f = new File("/data/data/com.hamr/databases/HomeNew.db");
        db = SQLiteDatabase.openOrCreateDatabase(f, null);

        // 1. get data from db
        // 2. parse through data
        exportOrder();
        exportMarket();
        exportInventory();
        p("end \n\n\n\n.");
    }

    @ReactMethod
    public void archive() {

        Context context = getApplicationContext();
       // File logFile = new File(context.getExternalFilesDir(null), getFileName());
        String dataFilesDir = getReactApplicationContext().getFilesDir().getPath();
        String[] files = { "mdinventory.dat", "mdmarket.dat", "mdorder.dat" };
        String[] noExtension = { "mdinventory", "mdmarket", "mdorder" };

        File dirPath = new File(context.getExternalFilesDir(null).getPath(), "/archive");
        if (!dirPath.exists()) {
            dirPath.mkdir();
        }

        // Archive files
        for (int i = 0; i < files.length; i++) {
            try {
                String source = dataFilesDir + "/" + files[i];
                Hamr.Logging.log("Source:  " + source);
                String timestamp = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
                String dest = context.getExternalFilesDir(null).getPath() + "/archive/" + noExtension[i] + "_" + timestamp + ".dat";
                Hamr.Logging.log("Source:  " + source);
                Hamr.Logging.log("Dest:  " + dest);
                p(source);
                p(dest);
                File fSource = new File(source);
                File fDest = new File(dest);
              //  if (!fSource.renameTo(fDest))
              //  {
              //      Hamr.Logging.log("Archiving error");
               // }
                try{copy(fSource,fDest);}
                catch(Exception er){ Hamr.Logging.error("Failed to archive " + files[i], er.getMessage()); }

                Hamr.Logging.log("Archiving " + dest + " complete.");
            }
            catch (Exception ex) {
                Hamr.Logging.error("Failed to archive " + files[i], ex.getMessage());
            }


        }

    }

    // Helper Functions
    public void p(String s) {
        Log.i("NativeData", s);
    }

    public static void copy(File src, File dst) throws IOException {
        InputStream in = new FileInputStream(src);
        try {
            OutputStream out = new FileOutputStream(dst);
            try {
                // Transfer bytes from in to out
                byte[] buf = new byte[1024];
                int len;
                while ((len = in.read(buf)) > 0) {
                    out.write(buf, 0, len);
                }
            } finally {
                out.close();
            }
        } finally {
            in.close();
        }
    }
}
