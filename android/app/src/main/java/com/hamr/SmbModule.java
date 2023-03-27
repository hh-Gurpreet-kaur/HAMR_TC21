package com.hamr;

import android.database.sqlite.SQLiteDatabase;
import android.os.Environment;
import android.util.Log;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import jcifs.CIFSException;
import jcifs.SmbResource;
import jcifs.config.PropertyConfiguration;
import jcifs.context.SingletonContext;
import jcifs.smb.SmbException;
import jcifs.smb.SmbFile;
import jcifs.smb.NtlmPasswordAuthenticator;
import jcifs.smb.SmbFileOutputStream;
import jcifs.SmbResourceLocator;
import jcifs.context.BaseContext;
import jcifs.config.BaseConfiguration;
import jcifs.CIFSContext;

import java.io.*;
import java.net.MalformedURLException;
import java.net.UnknownHostException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Properties;

public class SmbModule extends ReactContextBaseJavaModule {

    private String domain;
    private CIFSContext smbAuth;
    private CIFSContext smbPrismAuth;

    public SmbModule(ReactApplicationContext reactContext) {
        super(reactContext);

        domain = "null";
    }

    @Override
    public String getName() {
        return "SmbModule";
    }

    private boolean checkDatabaseModified(String ipAddress) throws SmbException {
        boolean shouldSync = false;
        String url = "smb://" + ipAddress + "/home/mobile/export/ex1.tmp";

        String filesDir = getReactApplicationContext().getFilesDir().getPath();
        File destFile = new File(filesDir, "ex1.tmp");

        if (!destFile.exists()) {
            return true;
        }

        try (SmbFile sourceFile = new SmbFile(url, smbAuth)) {
            long sourceModified = sourceFile.lastModified();
            long destModified = destFile.lastModified();
            if (destModified < sourceModified) {
                shouldSync = true;
            } else {
                shouldSync = false;
            }
        } catch (MalformedURLException ex) {
            p(ex.getMessage());
        }

        return shouldSync;
    }

    // check to avoid blank Order files for Integrated version
    private boolean checkOrderCountsModified(String ipAddress) throws SmbException {
        boolean shouldSync = false;
        String url = "smb://" + ipAddress + "/home/mobile/import/mdorder.dat";

        String filesDir = getReactApplicationContext().getFilesDir().getPath();
        File destFile = new File(filesDir, "mdorder.dat");

        if (!destFile.exists()) {
            return true;
        }

        try (SmbFile sourceFile = new SmbFile(url, smbAuth)) {
            long sourceModified = sourceFile.lastModified();
            long destModified = destFile.lastModified();
            if (destModified < sourceModified) {
                shouldSync = true;
            } else {
                shouldSync = false;
            }
        } catch (MalformedURLException ex) {
            p(ex.getMessage());
        }

        return shouldSync;
    }

    // check to avoid blank inventory files Integrated version
    private boolean checkInventoryCountsModified(String ipAddress) throws SmbException {
        boolean shouldSync = false;
        String url = "smb://" + ipAddress + "/home/mobile/import/mdinventory.dat";

        String filesDir = getReactApplicationContext().getFilesDir().getPath();
        File destFile = new File(filesDir, "mdinventory.dat");

        if (!destFile.exists()) {
            return true;
        }
        try (SmbFile sourceFile = new SmbFile(url, smbAuth)) {
            long sourceModified = sourceFile.lastModified();
            long destModified = destFile.lastModified();
            if (destModified < sourceModified) {
                shouldSync = true;
            } else {
                shouldSync = false;
            }
        } catch (MalformedURLException ex) {
            p(ex.getMessage());
        }

        return shouldSync;
    }

    private boolean checkSAOrderCountsModified(String ipAddress) throws SmbException {
        boolean shouldSync = false;
        String url = "smb://" + ipAddress + "/home/mobile/import/mdorder.dat";

        String filesDir = getReactApplicationContext().getFilesDir().getPath();
        File destFile = new File(filesDir, "mdorder.dat");

        if (!destFile.exists()) {
            return true;
        }
        try (SmbFile sourceFile = new SmbFile(url, smbAuth)) {
            if (sourceFile.exists()) {
                shouldSync = true;
            } else {
                shouldSync = false;
            }
        } catch (MalformedURLException ex) {
            p(ex.getMessage());
        }

        return shouldSync;
    }

    // check to avoid blank inventory files StandAlone version
    private boolean checkSAInventoryCountsModified(String ipAddress) throws SmbException {
        boolean shouldSync = false;
        String url = "smb://" + ipAddress + "/home/mobile/import/mdinventory.dat";

        String filesDir = getReactApplicationContext().getFilesDir().getPath();
        File destFile = new File(filesDir, "mdinventory.dat");

        if (!destFile.exists()) {
            return true;
        }

        try (SmbFile sourceFile = new SmbFile(url, smbAuth)) {
            if (sourceFile.exists()) {
                shouldSync = true;
            } else {
                shouldSync = false;
            }
        } catch (MalformedURLException ex) {
            p(ex.getMessage());
        }

        return shouldSync;
    }

    @ReactMethod
    public void syncFilesFromServer(ReadableArray listOfFiles, String ipAddress, String smbUsername, String smbPassword,
            boolean forceSync, Promise promise) throws CIFSException, MalformedURLException {

        p("-------------------------------------------------------------------");
        p("Syncing in...");
        Hamr.Logging.log("Syncing files from server.");

        try {
            CIFSContext base = SingletonContext.getInstance();
            smbAuth = base.withCredentials(new NtlmPasswordAuthenticator(domain, smbUsername, smbPassword));

            if (forceSync || checkDatabaseModified(ipAddress)) {

                long startTime = System.currentTimeMillis();

                for (int i = 0; i < listOfFiles.size(); i++) {
                    copyFileFromServer(listOfFiles.getString(i), ipAddress);
                }

                long elapsed = System.currentTimeMillis() - startTime;

                Hamr.Logging.log("Total Elapsed Time: " + elapsed + "ms");
                p("Total Elapsed Time: " + elapsed + "ms");

                promise.resolve(true);
            }
        } catch (Exception ex) {
            p(ex.getMessage());
            Hamr.Logging.error("Error syncing files from server. Stopping sync process.", ex.getMessage());
            promise.resolve(false);
        }

        Hamr.Logging.log("Requested database is older than existing database. Stopping sync.");
        promise.resolve("complete");
    }

    @ReactMethod
    public void syncFilesToServer(ReadableArray listOfFiles, String ipAddress, String smbUsername, String smbPassword,
            String prismServer, String prismUser, String prismPassword, boolean guestAccess,
            Promise promise) throws CIFSException, MalformedURLException {

        File dbPath = new File(getReactApplicationContext().getDataDir().getPath(), "/files/Images.tar");

        p("-------------------------------------------------------------------");
        Hamr.Logging.log("Exporting files to server.");
        p("Syncing in...");
        try {
            CIFSContext base = SingletonContext.getInstance();
            smbAuth = base.withCredentials(new NtlmPasswordAuthenticator(domain, smbUsername, smbPassword));
            if (guestAccess) {
                smbPrismAuth = base.withGuestCrendentials();
            } else {
                smbPrismAuth = base.withCredentials(new NtlmPasswordAuthenticator(domain, prismUser, prismPassword));
            }

            long startTime = System.currentTimeMillis();
            String dataFilesDir = getReactApplicationContext().getFilesDir().getPath();

            for (int i = 0; i < listOfFiles.size(); i++) {
                String smbDir = "smb://" + ipAddress + "/home/mobile/import/";
                if (!prismServer.equals("")
                        && ((checkInventoryCountsModified(ipAddress) || checkOrderCountsModified(ipAddress))
                                || (!checkInventoryCountsModified(ipAddress) || !checkOrderCountsModified(ipAddress)))) {
                    if (listOfFiles.getString(i).equals("mdinventory.dat") ||
                            listOfFiles.getString(i).equals("mdorder.dat")) {
                        smbDir = "smb://" + prismServer + "/import/";
                        copyFileToServer(listOfFiles.getString(i), listOfFiles.getString(i), ipAddress, dataFilesDir,
                                smbDir, true);
                    } else {
                        copyFileToServer(listOfFiles.getString(i), listOfFiles.getString(i), ipAddress, dataFilesDir,
                                smbDir, false);
                    }
                } else if (prismServer.equals("") && ((checkSAInventoryCountsModified(ipAddress)
                        || checkSAOrderCountsModified(ipAddress))
                        || (!checkSAInventoryCountsModified(ipAddress) ||  !checkSAOrderCountsModified(ipAddress)))) {
                    copyFileToServer(listOfFiles.getString(i), listOfFiles.getString(i), ipAddress, dataFilesDir,
                            smbDir, false);
                }

            }
            long elapsed = System.currentTimeMillis() - startTime;
            p("Total Elapsed Time: " + elapsed + "ms");
            Hamr.Logging.log("Total Elapsed Time: " + elapsed + "ms");
        }

        catch (Exception ex) {
            p(ex.getMessage());
            Hamr.Logging.error("Error exporting files to server. Stopping sync process.", ex.getMessage());
            promise.resolve(false);
        }
        promise.resolve(true);
    }
 
    @ReactMethod
    public void backupDatabase(String dbName, String outputDir, String ipAddress, String storeNum,
            String user, String pass,
            Promise promise) throws CIFSException, MalformedURLException {

        p("-------------------------------------------------------------------");
        Hamr.Logging.log("Backing up database to server.");
        p("Syncing out...");
        CIFSContext base = SingletonContext.getInstance();

        String filename = "";

        smbAuth = base.withCredentials(new NtlmPasswordAuthenticator(domain, user, pass));
        // smbAuth = base.withAnonymousCredentials();

        try {
            long startTime = System.currentTimeMillis();
            String dataFilesDir = getReactApplicationContext().getDataDir().getPath() + "/databases/";
            String smbDir = "smb://" + ipAddress + outputDir;

            p(smbDir);

            try (SmbFile dir = new SmbFile(smbDir, smbAuth);
                    SmbResource f = new SmbFile(dir, storeNum + "/")) {

                if (!f.exists()) {
                    f.mkdirs();
                }

                filename = getFilename(smbDir, storeNum) + ".db";
            }

            copyFileToServer(dbName, filename, ipAddress, dataFilesDir, smbDir + storeNum + "/", false);

            long elapsed = System.currentTimeMillis() - startTime;
            p("Total Elapsed Time: " + elapsed + "ms");
            Hamr.Logging.log("Total Elapsed Time: " + elapsed + "ms");
        } catch (Exception ex) {
            p(ex.getMessage());
            Hamr.Logging.error("Error backing up  to server. Stopping backup process.", ex.getMessage());
            promise.resolve(false);
        }
        promise.resolve(filename);
    }

    String getFilename(String dir, String storeNum) throws SmbException, MalformedURLException {

        DateFormat dateFormat = new SimpleDateFormat("yyyyMMdd");
        Date date = new Date();
        String dateString = dateFormat.format(date);
        int fileCount = 1;

        try (SmbFile smbDir = new SmbFile(dir + storeNum + "/", smbAuth)) {
            SmbFile[] files = smbDir.listFiles();

            for (SmbFile file : files) {
                String filename = file.getName();
                String fileDate = filename.substring(0, filename.length() - 4);

                if (fileDate.equals(dateString)) {
                    int tempFileCount = Integer
                            .parseInt(filename.substring(filename.length() - 4, filename.length() - 3)) + 1;
                    if (tempFileCount > fileCount) {
                        fileCount = tempFileCount;
                    }
                }
            }
        }

        return dateString + fileCount;
    }

    @ReactMethod
    public void restoreDatabase(String dbName, String sourceFilename, String importDir, String ipAddress,
            String storeNum,
            String user, String pass,
            Promise promise) throws CIFSException, MalformedURLException {

        p("-------------------------------------------------------------------");
        Hamr.Logging.log("Restoring database backup from server.");
        p("Syncing in...");
        CIFSContext base = SingletonContext.getInstance();

        smbAuth = base.withCredentials(new NtlmPasswordAuthenticator(domain, user, pass));
        // smbAuth = base.withAnonymousCredentials();

        try {
            long startTime = System.currentTimeMillis();
            String smbDir = "smb://" + ipAddress + importDir + storeNum + "/";

            copyFileFromServer(dbName, sourceFilename, ipAddress, smbDir);

            long elapsed = System.currentTimeMillis() - startTime;
            p("Total Elapsed Time: " + elapsed + "ms");
            Hamr.Logging.log("Total Elapsed Time: " + elapsed + "ms");
        } catch (Exception ex) {
            p(ex.getMessage());
            Hamr.Logging.error("Error restoring backup from server. Stopping restore process.", ex.getMessage());
            ;
            promise.resolve(false);
        }
        promise.resolve(true);
    }

    private void copyFileFromServer(String destFilename, String filename, String ipAddress, String smbDir)
            throws IOException {
        int bufLength = 61440; // Windows SMB truncates data into chunks of 61440
        String dataFilesDir = getReactApplicationContext().getFilesDir().getPath();

        long startTime = System.currentTimeMillis();
        String url = "";

        if (smbDir.equals("")) {
            String defaultDir = "smb://" + ipAddress + "/home/mobile/";
            if (filename.equals("ImageLinks.db")) {
                url = defaultDir + "images/" + filename;
            } else if (getFileExtension(filename).equals("db")) {
                url = defaultDir + "database/" + filename;
            } else if (getFileExtension(filename).equals("tar")) {
                url = defaultDir + "images/" + filename;
            } else if (getFileExtension(filename).equals("tmp")) {
                url = defaultDir + "export/" + filename;
            } else if (getFileExtension(filename).equals("ini")) {
                url = defaultDir + "../" + filename;
            } else {
                url = defaultDir + filename;
            }
        } else {
            url = smbDir + filename;
        }

        p(url);

        try (SmbFile sourceFile = new SmbFile(url, smbAuth)) {
            File destFile = new File(dataFilesDir, destFilename);

            InputStream in = sourceFile.getInputStream();
            OutputStream out = new FileOutputStream(destFile);

            p("Copying " + filename);
            Hamr.Logging.log("Copying " + filename);
            // Copy the bits from Instream to Outstream
            byte[] buffer = new byte[bufLength];
            int lenRead;
            while ((lenRead = in.read(buffer)) > 0) {
                out.write(buffer, 0, lenRead);
            }

            in.close();
            out.close();

            p("Finished copying.");
            long estimatedTime = System.currentTimeMillis() - startTime;
            p("Elapsed Time: " + estimatedTime + "ms");
            Hamr.Logging.log("Finished copying. Estimated time: " + estimatedTime + "ms");

            if (getFileExtension(destFile.getName()).equals("db")) {
                File dirPath = new File(getReactApplicationContext().getDataDir().getPath(), "/databases");
                if (!dirPath.exists()) {
                    dirPath.mkdir();
                }

                String source = dataFilesDir + "/" + destFile.getName();
                String dest = dataFilesDir + "/../databases/" + destFile.getName();
                p(source);
                p(dest);
                File fSource = new File(source);
                fSource.renameTo(new File(dest));
                // Files.move(Paths.get(source), Paths.get(dest));
            }

        } catch (MalformedURLException ex) {
            p(ex.getMessage());
        }
    }

    private void copyFileFromServer(String filename, String ipAddress) throws IOException {
        try {
            copyFileFromServer(filename, filename, ipAddress, "");
        } catch (IOException ex) {
            throw ex;
        }
    }

    private void copyFileToServer(String filename, String destFilename, String ipAddress, String dataFilesDir,
            String smbDir, boolean prismAuth) throws IOException {
        int bufLength = 61440; // Windows SMB truncates data into chunks of 61440

        long startTime = System.currentTimeMillis();
        p(smbDir);
        CIFSContext auth = prismAuth ? smbPrismAuth : smbAuth;

        String formattedFilename = destFilename;
        if (prismAuth) {
            String timestamp = new SimpleDateFormat("_yyyyMMdd_HHmmss").format(new Date());
            formattedFilename = formattedFilename.replace(".dat", timestamp + ".dat");
        }

        try (SmbFile destFile = new SmbFile(smbDir + formattedFilename, auth)) {
            File sourceFile = new File(dataFilesDir, filename);
            long sourceModified = sourceFile.lastModified();
            long destModified = destFile.lastModified();
            if ((prismAuth && sourceFile.exists() && (destModified < sourceModified) && !destFile.exists())
                    || (sourceFile.exists() && !prismAuth)) {
                InputStream in = new FileInputStream(dataFilesDir + "/" + filename);
                OutputStream out = destFile.openOutputStream(true);

                p("Copying " + filename);
                Hamr.Logging.log("Copying " + filename);

                // Copy the bits from Instream to Outstream
                byte[] buffer = new byte[bufLength];
                int lenRead;
                while ((lenRead = in.read(buffer)) > 0) {
                    out.write(buffer, 0, lenRead);
                }

                in.close();
                out.flush();
                out.close();

                p("Finished copying.");
                long estimatedTime = System.currentTimeMillis() - startTime;
                p("Elapsed Time: " + estimatedTime + "ms");
                Hamr.Logging.log("Finished copying. Estimated time: " + estimatedTime + "ms");
            } else {
                p("File not found: " + dataFilesDir + "/" + filename);
                Hamr.Logging.log("File not found: " + dataFilesDir + "/" + filename);
            }

        } catch (MalformedURLException ex) {
            p(ex.getMessage());
        }
    }

    private CIFSContext getContext() throws CIFSException {
        return new BaseContext(new BaseConfiguration(true));
    }

    private static void p(String log) {
        Log.e("SMB", log);
    }

    private String getFileExtension(String filename) {
        String extension = "";

        int index = filename.lastIndexOf('.');
        if (index > 0) {
            extension = filename.substring(index + 1);
        }

        return extension;
    }
 }