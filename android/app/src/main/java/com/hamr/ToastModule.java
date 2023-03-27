// Where do I belong?
package com.hamr;

// Who all do I need?

import android.database.sqlite.SQLiteDatabase;
import android.widget.Toast;
import android.util.Log;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import java.lang.Long;

import java.io.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

public class ToastModule extends ReactContextBaseJavaModule {

	// Constants ( set in constructor )
	private File dbPath;
	private SQLiteDatabase db;

	// whats up guys? app sends context
	public ToastModule(ReactApplicationContext reactContext) {
		super(reactContext);

	}

	// nice to meet you, my name is?
	@Override
	public String getName() {
		return "ToastExample";
	}

	// PRIVATE HELPERS

	private static int symbolCount(String s, String symbol) {
		int count = 0;
		int x;
		while ( (x = s.indexOf(symbol)) != -1 ) {
			++count;
			s = s.substring(x+1);
		}
		return count;
	}

	// make sure | * | in REPEAT is ready for SQL exec
	private static String cleanRepeatValue (String s) {
		int comma;
		while ( (comma = s.indexOf(",")) != -1 ) {
			s = s.substring(0, comma) + s.substring(comma+1);
		}

		int quote;
		while ( (quote = s.indexOf("\'")) != -1 ) {
			s = s.substring(0, quote) + s.substring(quote+1);
		}
       
		/* int questionmark;
		while ( (quote = s.indexOf("?")) != -1 ) {
			s = s.substring(0, questionmark) + s.substring(questionmark+1);
		} */
		// string check
		if( !s.matches("[0-9]+") ) {
			s = new String("\'" + s + "\'");
		}
		return s;
	}

	private static String insertIntoUpdate(int i, String update, String word) {
		if(i != -1) {
			String s = new String ( update.substring(0, i) + word + update.substring(i+1) );
			return s;
		}
		return "";
	}



	// Send in update template + repeat line
	// Returns Update string to store
	private static String singleRepeatUpdate(String update, String repeatLine) {
		int bCount = symbolCount(update, "?");

		// split repeatLine values
		ArrayList<String> val = new ArrayList<>();
		int found;
		String s;

		while ( (found = repeatLine.indexOf("|")) != -1 ) {
			s = repeatLine.substring(0, found);
			repeatLine = repeatLine.substring(found+1);
			val.add( cleanRepeatValue(s) );
		}
		// last does not have '|'
		val.add(repeatLine);
		int index = 0;
		for (int i=0; i<val.size(); ++i) {
			// get index of next ?
			index = update.indexOf("?");

			// insert thang(i) at index
			update = insertIntoUpdate( index, update, val.get(i) );
		}
		return update;
	}

	// Send in insert template + repeat line 
	// Returns Insert string to store
	private static String singleRepeatInsert(String insert, String repeatLine) {
		// TEST to make sure no template mismatch

		// count number of question marks
		int iPos =  insert.lastIndexOf("VALUES ");
		iPos += 7;
		String s = insert.substring(iPos);
		int qCount = symbolCount(s, "?");


		// count number of bars in repeat line
		int rCount = symbolCount(repeatLine, "|");


		// extract individual values by |
		ArrayList<String> val = new ArrayList<>(qCount);
		if (qCount - rCount == 1) {
			int pos;
			int i = 0;
			String v;

			while( (pos = repeatLine.indexOf("|")) != -1 ) {
				++i;

				v = repeatLine.substring(0, pos);
				repeatLine = repeatLine.substring(pos+1);

				v = cleanRepeatValue(v);

				val.add(v);

			}
			repeatLine = cleanRepeatValue(repeatLine);
			val.add(repeatLine);
		}

		// create end of values
		StringBuilder finalCmd = new StringBuilder("VALUES (");
		for (int i=0; i<val.size(); ++i) {
			String add = val.get(i);
			if (i != val.size() - 1) {
				add = add + ", ";
			}
			finalCmd.append( add );
		}

		finalCmd.append(")");

		// get first part from insert
		iPos = insert.lastIndexOf("VALUES");
		String cmd = insert.substring(0, iPos);

		String ans = new String(cmd + finalCmd.toString() + "\n");
		return ans;


	}

	// shorthand logger
	private static void p(String log) {
		Log.e("NativeData", log);
	}


	// main db creation method
	@ReactMethod
	public void createDatabase(Promise promise) {



		long total = System.currentTimeMillis();

		File dirPath = new File(getReactApplicationContext().getDataDir().getPath(), "/databases");
		if (!dirPath.exists()) {
			Hamr.Logging.log("Creating databases directory.");
			dirPath.mkdir();
		}

		Hamr.Logging.log("Creating new database");

		try {
			dbPath = new File(getReactApplicationContext().getDataDir().getPath() ,"/databases/HomeNew.db");
			SQLiteDatabase.deleteDatabase(dbPath);
			db = SQLiteDatabase.openOrCreateDatabase(dbPath, null);
		}
		catch (Exception ex) {
			Hamr.Logging.log("Error creating database:");
			Hamr.Logging.error("Error creating database", ex.getMessage());
		}


		Log.e("NativeData", "\n\nCreating New Database ");

		// get keywords location
		File key = new File(getReactApplicationContext().getFilesDir().getPath(), "Keywords.txt");

		// get file location
		File[] fileList = new File[] {
				new File(getReactApplicationContext().getFilesDir().getPath(), "ex1.tmp"),
				new File(getReactApplicationContext().getFilesDir().getPath(), "ex2.tmp"),
				new File(getReactApplicationContext().getFilesDir().getPath(), "ex3.tmp")
		};

		long startTime = System.currentTimeMillis();
		p("Creating Keywords table");
		Hamr.Logging.log("Creating keywords table");

		// keyword table gen
		try {
			BufferedReader r = new BufferedReader(new FileReader(key));

			String s;
			int read = 0;
			ArrayList<String> buffer = new ArrayList<>();


			db.execSQL("CREATE TABLE Keywords (ItemSku integer, Description nvarchar(255))");

			StringBuilder batchString = new StringBuilder("INSERT INTO KEYWORDS VALUES ");

			while( (s = r.readLine()) != null) {
				if ( s.trim().length() == 0)
				continue;
				String[] arr = s.split("\\|");

				batchString.append("(" + arr[0] + ", " + cleanRepeatValue(arr[1].trim()) + "), ");

			}

			StringBuilder query = batchString.delete(batchString.length() -2, batchString.length());

			db.beginTransaction();
			try {
				p("Writing Keywords: " + read + " keywords");
				db.execSQL( query.toString() );
				db.setTransactionSuccessful();
			} finally {
				db.endTransaction();
			}

		} catch (IOException e) {
			Log.e("NativeData", e.getMessage());
			Hamr.Logging.error("IO Exception.", e.getMessage());
		}

		long elapsed = System.currentTimeMillis() - startTime;
		p("Elapsed Time: " + elapsed + "ms");

		// flat file processing
		for (int index=0; index<fileList.length; ++index) {
			// fetch file
			File dir = fileList[index];

			// main process
			try {
				FileReader f = new FileReader(dir);
				BufferedReader br = new BufferedReader(f);
				String line;


				// line by line read
				while ((line = br.readLine()) != null) {
					if ( line.trim().length() == 0)
					continue;
					
					// handle COMMENT
					boolean isComment = line.startsWith("--");
					if(isComment) {
						Log.e("NativeData" ,line+"\n");
						Hamr.Logging.log(line);
						continue;
					}
					boolean isEmpty = line.isEmpty();
					if(isEmpty) {
						Log.e("NativeData" ,line+"\n");
						Hamr.Logging.log(line);
						continue;
					}
					if (line.isEmpty()) continue;
					// handle CREATE
					boolean isCreate = line.startsWith("CREATE");
					if (isCreate) {
						Log.e("NativeData" ,"CREATE found");
						// execute sql
						db.execSQL(line);
						continue;
					}


					// handle INSERT + REPEAT
					boolean isInsert = line.startsWith("INSERT");
					if (isInsert) {
						Log.e("NativeData", "INSERT template found");

						// save insert template
						String insCmd = line;

						p("INSERT found, looking for REPEAT");

						// read another line to make sure REPEAT
						String s;
						s = br.readLine();
						if ( s.trim().length() == 0)
						continue;

						// check for repeat
						boolean isRepeat = s.startsWith("REPEAT");
						if (isRepeat) {
							p("REPEAT + INSERT found");
							startTime = System.currentTimeMillis();

							StringBuilder repeatBuffer = new StringBuilder();

							// REPEAT LINES
							int repCount = 0;

							int valuePos = insCmd.lastIndexOf("VALUES");
							insCmd = insCmd.substring(0, valuePos - 1);

							Boolean[] rules = isHash(insCmd);

							repeatBuffer.append(insCmd + " VALUES");

							while((s = br.readLine()) != null) {
								if ( s.trim().length() == 0)
								continue;
								++repCount;

								// not adding first or last line
								if (s.startsWith("REPEAT")) {
									// get other lines
									continue;
								}
								// break point
								if(s.length() < 2) {
									if (s.startsWith(")"))
									// REPEAT delimiter found (s)
									break;
								}

								String cleanedString = s.replace("'", "''");

								try {
									String[] insertParams = cleanedString.split("\\|");
									repeatBuffer.append(" ('");

									for(int i = 0; i < rules.length; i++) {

										if (i < insertParams.length) {
											if (rules[i]) {
												insertParams[i] = computeHash(insertParams[i]);
											}

											repeatBuffer.append(insertParams[i]);
										}

										if (i != rules.length - 1) {
											repeatBuffer.append("','");
										}
										else {
											repeatBuffer.append("'),");
										}

									}
								} catch (Exception ex) {
									p(ex.getMessage());
									Hamr.Logging.log(ex.getMessage());
								}

								// FLUSHED BATCH SQL QUERY

								// flush threshold
								int flush = 5000;

								if (repCount == flush) {
									repCount = 0;

									StringBuilder repeatQuery = repeatBuffer.deleteCharAt(repeatBuffer.length() -1);
									repeatQuery.append(";");

									db.beginTransaction();
									try {
										db.execSQL( repeatBuffer.toString() );
										repeatBuffer = new StringBuilder(insCmd + " VALUES");
										db.setTransactionSuccessful();
									} finally {
										db.endTransaction();
									}

								}
							}

							if (repCount > 1) {
								StringBuilder repeatQuery = repeatBuffer.deleteCharAt(repeatBuffer.length() -1);
								repeatQuery.append(";");
							//	Hamr.Logging.log(repeatQuery.toString());
								// process full Repeat
								db.beginTransaction();
								try {
									db.execSQL( repeatQuery.toString() );
									db.setTransactionSuccessful();
								} finally {
									db.endTransaction();
								}
							}

							//System.gc();
							p("Completed INSERTS + REPEAT");

							elapsed = System.currentTimeMillis() - startTime;
							p("Elapsed Time: " + elapsed + "ms");


							// should be continue
							continue;
						}
					}




					// HANDLE UPDATE + REPEAT
					boolean isUpdate = line.startsWith("UPDATE");
					if (isUpdate) {
						p("UPDATE found");

						// save update template
						String updCmd = line;
						p("UPDATE found, looking for REPEAT");

						// check next line for REPEAT
						String s = br.readLine();
						if ( s.trim().length() == 0)
						continue;
						boolean isRepeat = s.startsWith("REPEAT");

						if (isRepeat) {
							p("UPDATE + REPEAT found");

							ArrayList<String> u = new ArrayList<>();

							int lineCount = 0;
							while ( (s=br.readLine()) != null ) {
								if ( line.trim().length() == 0)
								continue;
								++lineCount;

								// skip first line
								if(s.startsWith("REPEAT")) {
									continue;
								}
								// skip last line
								if(s.length() < 2) {
									if (s.startsWith(")"))
										// REPEAT delimiter found (s)
										break;
								}

								// get formatted line
								s = singleRepeatUpdate(updCmd, s);
								u.add(s);

								// set flush
								int flush = 2500;

								// main sql query begins now
								if (lineCount == flush) {
									lineCount = 0;
//								p("flush")

									db.beginTransaction();
									try {
										for(int i=0; i<u.size(); ++i) {
											db.execSQL( u.get(i) );
										}
										db.setTransactionSuccessful();
									} finally {
										db.endTransaction();
									}

									u.clear();
								}
							}
							// remaining commands
							db.beginTransaction();
							try {
								for(int i=0; i<u.size(); ++i) {
									db.execSQL( u.get(i) );
								}
								db.setTransactionSuccessful();
							} finally {
								db.endTransaction();
							}
							u = null;
							System.gc();
							p("UPDATE + REPEAT done." + lineCount );
						}

						continue;
					}

				}

				br.close();
				getStoreNum();
			} catch (Exception e) {
				Hamr.Logging.error("Something went wrong. Stopping DB creation.", e.getMessage());
				Log.e("NativeData", "\n\n\t THREW \n\n." + e.getMessage()+ "\n\n");

				promise.resolve(true);
				continue;
			}

			Log.e("NativeData", "file #" + fileList[index].toString() + " done!");
		}


		p("Done");
		long totalElapsed = System.currentTimeMillis() - total;
		p("Total Elapsed Time: " + totalElapsed + " ms");
		Hamr.Logging.log("Finished DB Creation. Total Elapsed Time: " + totalElapsed + "ms");

		promise.resolve(false);
	}

	private void getStoreNum() {
		File file = new File(getReactApplicationContext().getFilesDir().getPath(), "home.ini");

		try {
			BufferedReader reader = new BufferedReader(new FileReader(file));
			String line = "";

			dbPath = new File(getReactApplicationContext().getDataDir().getPath() ,"/databases/HomeNew.db");
			db = SQLiteDatabase.openOrCreateDatabase(dbPath, null);

			while( (line = reader.readLine()) != null) {
				if ( line.trim().length() == 0)
				continue;

				if (line.toLowerCase().startsWith("storenum=")) {
					String storeNum = line.substring(line.indexOf('=') + 1);
					String insertString = "INSERT INTO Settings VALUES (\"StoreNum\", \"" + storeNum + "\")";
					db.execSQL(insertString);
				}

			}
		} catch (Exception ex) {
			p(ex.getMessage());
		}

	}

	private Boolean[] isHash(String insertString) {

		String[] insertParams = insertString.split(",");
		Boolean[] rules = new Boolean[insertParams.length];

		for (int i = 0; i < insertParams.length; i++) {
			rules[i] = insertParams[i].lastIndexOf("Hash") > 0;
		}


		return rules;
	}

	private String computeHash(String value) {

		byte[] bytes = value.getBytes();
		long p = 16777619L;
		long hash = 2166136261L;

		for (int i = 0; i < bytes.length; i++)
		{
			hash = (hash ^ bytes[i]) * p;
		}

		hash += hash << 13;
		hash ^= hash >> 7;
		hash += hash << 3;
		hash ^= hash >> 17;
		hash += hash << 5;

		return String.valueOf((int)hash);
	}

}