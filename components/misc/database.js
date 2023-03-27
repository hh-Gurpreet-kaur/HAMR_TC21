import sql from 'react-native-sqlite-storage'

sql.DEBUG(false)
sql.enablePromise(true)

let sqlConnection = null

const sqldb = {
  executeReader: function (query) {
    return new Promise(resolve => {
      let results = []

      sql.openDatabase({
        name: config.dbName,
        location: config.dbPath
      }).then((db) => {
        sqlConnection = db
        db.transaction((tx) => {
          tx.executeSql(query, [], (tx, res) => {
            results = res.rows
            resolve(results)
          })
        })
      })
    })
  },

  executeQuery: function (query) {
    sql.openDatabase({
      name: config.dbName,
      location: config.dbPath
    }).then((db) => {
      sqlConnection = db
      db.executeSql(query)
    })
  },

  getImage: function (sku) {
    return new Promise(resolve => {
      sql.openDatabase({
        name: config.imageDbName,
        location: config.dbPath
      }).then((db) => {
        db.transaction((tx) => {
          const query = "SELECT TarOffset FROM ImageRef WHERE SkuNum='" + sku + "'"
          tx.executeSql(query, [], (tx, res) => {
            results = res.rows
            resolve(results)
          })
        })
      })
    })
  },

  closeDatabase: function () {
    if (sqlConnection) {
      sqlConnection.close(() => {}, () => {})
    }
  }
}

export default sqldb
