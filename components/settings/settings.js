import { AsyncStorage } from 'react-native'

let Settings = {
    // Default setting values
    showNumpad: false,
    lastSync: '',
    timeoutEnabled: true,
    timeout: '10',
    username: '',
    password: '',
    rememberMe: false,
    printerAddress: '',
    labelType: 'shelf',
    serverUsername: '',
    serverPassword: '',
    ipAddress: '',
    isThirdParty: false,
    autoPrint: false,
    backupFilename: "",
    prismUsername: "",
    prismPassword: "",
    prismServer: "",
    guestAccess: false,

    loadSettings: function() {
        this.getShowNumpad();
        this.getLastSync();
        this.getTimeoutEnabled();
        this.getTimeout();
        this.getLoginCreds();
        this.getprinterAddress();
        this.getLabelType();
        this.getUsername();
        this.getPassword();
        this.getIpAddress();
        this.getPrismUsername();
        this.getPrismPassword();
        this.getPrismServer();
        this.getIntegrated();
        this.getAutoPrint();
        this.getBackupFilename();
        this.getGuestAccess();
    },


    // GETTERS

    getShowNumpad: async function() {
        let showNumpad = await AsyncStorage.getItem("showNumpad");
        if (showNumpad != null && showNumpad != undefined) {
            this.showNumpad = showNumpad == "true" ? true : false;
        } 
    },

    getLastSync: async function() {
		let lastSync = await AsyncStorage.getItem("lastSync");
		if ((lastSync != null && lastSync != undefined)) {
			this.lastSync = lastSync;
		}
    },

    getTimeoutEnabled: async function() {
		let enabled = await AsyncStorage.getItem("timeoutEnabled");
		if (enabled != null && enabled != undefined) {
			this.timeoutEnabled = enabled == "true" ? true : false
		}
    },
    
    getTimeout: async function() {
		let timeout = await AsyncStorage.getItem("timeout");
		if (timeout != null && timeout != undefined) {
			this.timeout = timeout;
		}
    },
    
    getLoginCreds: async function() {
		let user = await AsyncStorage.getItem("rememberUser");
    let password = await AsyncStorage.getItem("rememberPassword");
    
		if (user != null && user != undefined) {
            this.username = user;
            this.rememberMe = true;
		}
		if (password != null && password != undefined) {
			this.password = password;
		}
    },
    
    getprinterAddress: async function() {
		let printerAddress =  await AsyncStorage.getItem("printerAddress");
		if ((printerAddress != null && printerAddress != undefined)) {
			this.printerAddress = printerAddress;
		}
    },
    
    getLabelType: async function() {
		let labelType =  await AsyncStorage.getItem("labelType");
		if ((labelType != null && labelType != undefined)) {
			this.labelType = labelType;
		}
    },
    
    getUsername: async function() {
		let username = await AsyncStorage.getItem("serverUsername");
		if ((username != null && username != undefined)) {
			this.serverUsername = username;
		}
	},
    
    getPassword: async function() {
		let password = await AsyncStorage.getItem("serverPassword");
		if ((password != null && password != undefined)) {
			this.serverPassword = password;
		}
    },
    
    getIpAddress: async function() {
		let ipAddress = await AsyncStorage.getItem("ipAddress");
		if ((ipAddress != null && ipAddress != undefined)) {
			this.ipAddress = ipAddress;
		}
    },

    getPrismUsername: async function() {
      let prismUsername = await AsyncStorage.getItem("prismUsername");
      if ((prismUsername != null && prismUsername != undefined)) {
        this.prismUsername = prismUsername;
      }
    },
      
      getPrismPassword: async function() {
      let prismPassword = await AsyncStorage.getItem("prismPassword");
      if ((prismPassword != null && prismPassword != undefined)) {
        this.prismPassword = prismPassword;
      }
      },
      
      getPrismServer: async function() {
      let prismServer = await AsyncStorage.getItem("prismServer");
      if ((prismServer != null && prismServer != undefined)) {
        this.prismServer = prismServer;
      }
      },

    getGuestAccess: async function() {
      let enabled = await AsyncStorage.getItem("guestAccess");
      if (enabled != null && enabled != undefined) {
        this.guestAccess = enabled == "true" ? true : false
      }
    },

    getIntegrated: function() {
      console.log("GET INTEGRATED: " + this.isThirdParty)
      return this.isThirdParty;
    },

    getAutoPrint: async function() {
      let autoPrint = await AsyncStorage.getItem("autoPrint");
      if ((autoPrint != null && autoPrint != undefined)) {
        this.autoPrint = autoPrint == "true" ? true : false
      }
    },

    getBackupFilename: async function() {
      let backupFilename = await AsyncStorage.getItem("backupFilename");
      if ((backupFilename != null && backupFilename != undefined)) {
        this.backupFilename = backupFilename;
      }
    },

    // SETTERS

    saveShowNumpad: async function(showNumpad) {
        this.showNumpad = showNumpad;
		await AsyncStorage.setItem("showNumpad", showNumpad.toString())
    },

    saveLastSync: async function() {
        let currDate = getCurrDate();
        this.lastSync = currDate;
        await AsyncStorage.setItem("lastSync", currDate);
    },

    saveTimeoutEnabled: async function(enabled) {
        this.timeoutEnabled = enabled;
		await AsyncStorage.setItem("timeoutEnabled", enabled.toString())
	},
    
    saveTimeout: async function(timeout) {
        this.timeout = timeout;
        if (timeout == '') {
          await AsyncStorage.setItem("timeout", '0')
        } else {
          let numValue = Number(timeout)
          if (numValue >= 1) {
            await AsyncStorage.setItem("timeout", timeout)
          }
        }
        
    },
    
    saveUserCreds: async function(rememberMe, username, password) {
		if (rememberMe) {
			await AsyncStorage.setItem("rememberUser", username)
      await AsyncStorage.setItem("rememberPassword", password)
      this.username = username;
      this.password = password;
      this.rememberMe = true;
		} else {
			await AsyncStorage.removeItem("rememberUser")
      await AsyncStorage.removeItem("rememberPassword")
      this.username = '',
      this.password = '',
      this.rememberMe = false
		}
    },
    
    savePrinterAddress: async function(printerAddress) {
        this.printerAddress = printerAddress;
        await AsyncStorage.setItem("printerAddress", printerAddress.toUpperCase())
    },

    saveLabelType: async function(labelType) {
        this.labelType = labelType;
        await AsyncStorage.setItem("labelType", labelType);
    },

    saveUsername: async function(username) {
        this.serverUsername = username;
		await AsyncStorage.setItem("serverUsername", username)
	},

	savePassword: async function(password) {
        this.serverPassword = password;
		await AsyncStorage.setItem("serverPassword", password)
	},

	saveIpAddress: async function(ipAddress) {
        this.ipAddress = ipAddress;
		await AsyncStorage.setItem("ipAddress", ipAddress)
  },

  savePrismUsername: async function(prismUsername) {
    this.prismUsername = prismUsername;
await AsyncStorage.setItem("prismUsername", prismUsername)
},

savePrismPassword: async function(prismPassword) {
    this.prismPassword = prismPassword;
await AsyncStorage.setItem("prismPassword", prismPassword)
},

savePrismServer: async function(prismServer) {
    this.prismServer = prismServer;
await AsyncStorage.setItem("prismServer", prismServer)
},

saveGuestAccess: async function(enabled) {
  this.guestAccess = enabled;
  await AsyncStorage.setItem("guestAccess", enabled.toString())
},
  
  saveIntegrated: async function(integrated) {
        this.isThirdParty = integrated;
  },

  saveAutoPrint: async function(autoPrint) {
    console.log("Saving auto print: " + autoPrint);
      this.autoPrint = autoPrint;
      let autoPrintString = autoPrint ? "true" : "false";
      await AsyncStorage.setItem("autoPrint", autoPrintString)
  },

  saveBackupFilename: async function(backupFilename) {
    this.backupFilename = backupFilename;
    await AsyncStorage.setItem("backupFilename", backupFilename)
  }
}





// Helper functions

function getCurrDate() {
    let now = new Date();
    let year = now.getFullYear().toString().substr(-2);
    let month = ('0' + (now.getMonth() + 1)).slice(-2);
    let day = ('0' + now.getDate()).slice(-2);
    let hour = ('0' + now.getHours()).slice(-2);
    let minute = ('0' + now.getMinutes()).slice(-2);;
    //let second = ('0' + now.getSeconds()).slice(-2);;

    return day + '/' + month + '/' + year + " " + hour + ":" + minute;
}


export default Settings;
