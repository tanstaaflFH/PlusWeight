//imports
import * as clsWeight from "../common/weight";
import * as storage from "./localStorage";
import clock from "clock";
import { display } from "display";
import * as gui from "./gui";
import { debug } from "../common/log";
import * as communication from "./communication";
import * as KEYS from "../common/identifier";
import * as utils from "../common/utils";

// Initialize data elements
let messageLog = []; // array that holds identifiers for unsuccessful messages ( to be repeated )
let weightsToBeLogged = storage.loadWeightsToBeLogged(); // weight entries that need still to be posted
let weightsPast = storage.loadWeightsPast(); // past weight entries fetched from web
let asyncOngoing = []; // UUID for all ongoing asynchronous requests
let appSettings = storage.loadSettings() || {weightUnit: clsWeight.UNITS.other};
let userTimeOffset;
resetLastWeight();
debug("weightsToBeLogged " + JSON.stringify(weightsToBeLogged));

// callback functions
function addWeightLog (data) {
  
  // create the new entry in the local array
  let newEntry = new clsWeight.Weight(new Date(), data.weight, data.fat);
  weightsToBeLogged.push(newEntry);
  storage.saveWeightsToBeLogged(weightsToBeLogged);
  debug("new weightstobelogged " + JSON.stringify(weightsToBeLogged));

  // show new open unsynched
  gui.remainingSync(weightsToBeLogged.length);

  // try to send to web
  sendWeightLog();
  
}

function addMessageLog(identifier, data) {

  let found = false;

  for (let index = 0; index < messageLog.length; index++) {
    if (messageLog[index] == identifier)  {
      found = true;
      break;
    }    
  }

  if (!found) {

    messageLog.push(identifier);

  }

  if (data.uuid) {
    updateSpinner(undefined, data.uuid);
  }

}

function sendWeightLog() {

  // send message to companion to upload
  if (weightsToBeLogged) {
    if (weightsToBeLogged.length>0) {
      
      let tempPost = weightsToBeLogged;

      for (let index = 0; index < tempPost.length; index++) {
        tempPost[index] = JSON.stringify(tempPost[index]);
        
      }

      let requestUUID = utils.UUID();
      let requestData = {
        key: KEYS.MESSAGE_POST_WEIGHTS_API,
        content: tempPost,
        uuid: requestUUID
      }
      updateSpinner(requestUUID,undefined);
      communication.sendData(requestData, KEYS.MESSAGE_POST_WEIGHTS_API, addMessageLog);
      debug(`App shall message companion to send a weight log.`);
    
    }
  }

}

function refreshWeightLog () {
  
  let requestUUID = utils.UUID();
  let requestData = {
    key: KEYS.MESSAGE_REQUEST_WEIGHT_LOG_API,
    content: "",
    uuid: requestUUID
  }
  updateSpinner(requestUUID,undefined);
  communication.sendData(requestData, KEYS.MESSAGE_REQUEST_WEIGHT_LOG_API, addMessageLog);
  debug(`App shall message companion to request web weight log.`);

}

// clock initialize
clock.granularity = "minutes";
clock.ontick = (evt) => {
  gui.setClock();
}

// Display initialize
gui.initGUI(weightsToBeLogged.length, weightsPast, addWeightLog, refreshWeightLog, appSettings.weightUnit);

// Messaging initialize
communication.initMessage(weightsReceivedFromAPI, weightsPostedToAPI, profileReceivedFromAPI, weightUnitChanged, retryMessaging, requestFailure);

// check if remaining unsynched weight logs
sendWeightLog();

/* Functions for display */
display.onchange = function() {

  if ( display.on ) {
    gui.setClock();
  }

};

/* Functions for data handling */
function requestProfile() {

  let requestUUID = utils.UUID();
  let requestData = {
    key: KEYS.MESSAGE_REQUEST_PROFILE_API,
    content: "",
    uuid: requestUUID
  }
  updateSpinner(requestUUID,undefined);
  communication.sendData(requestData, KEYS.MESSAGE_REQUEST_PROFILE_API, addMessageLog);
  debug(`App shall message companion to request user profile.`);

}

function profileReceivedFromAPI(data, uuid) {

  // Check if a defined error was returned from the companion
  if ( data === KEYS.ERROR_API_TOKEN_OLD_REFRESH_TOKEN ) {
    debug(`App could not refresh user profile from web ${data}`);
    return;
  }

  debug(`Received user profile from Web: ${JSON.stringify(data)}`);
  userTimeOffset = data.offsetFromUTCMillis;
  debug(`New time offset = ${userTimeOffset}`);
  updateSpinner(undefined,uuid);

}
 
function weightsReceivedFromAPI(data, uuid) {

  // Check if a defined error was returned from the companion
  if ( data === KEYS.ERROR_API_TOKEN_OLD_REFRESH_TOKEN ) {
    debug(`App could not refresh web weights ${data}`);
    return;
  }

  debug(`Received data from Web: ${JSON.stringify(data)}`);
  // clean up the date objects
  for (let index = 0; index < data.length; index++) {
    if (data[index]) {
      data[index].date = new Date(data[index].date);
    }
  }

  weightsPast = data;
  storage.saveWeightsPast(weightsPast);
  resetLastWeight();
  gui.setWeightList(weightsPast);
  updateSpinner(undefined,uuid);

}

function weightsPostedToAPI(data, uuid) {
/*  Callback if some of the weights have been posted to the web successfully.
The return array shows all UUID that have been posted. It loops through the array of 
weightsToBeLogged and removes the already posted entries */

  debug(`Successfully posted data to Web: ${JSON.stringify(data)}`);

  for (let index = 0; index < data.length; index++) {
    // loop through all returned entries  
    for (let index = 0; index < weightsToBeLogged.length; index++) {
      // loop through all remaining log entries
      if (weightsToBeLogged[index].logID = data[index] ) {
        weightsToBeLogged.splice(index, 1); // delete from array if UUID matches
        break;
      }
    }    
  }

  // save remaining entries to be logged
  storage.saveWeightsToBeLogged(weightsToBeLogged);

  // update GUI with remaining numbers
  gui.remainingSync(weightsToBeLogged.length);
  updateSpinner(undefined,uuid);

}

function requestFailure(error, uuid) {

  updateSpinner(undefined,uuid);
  let errorMessage;
  if ((error.indexOf(KEYS.ERROR_API_TOKEN_GENERAL) !== -1) || (error.indexOf(KEYS.ERROR_API_TOKEN_OLD_REFRESH_TOKEN) !== -1)) {
    errorMessage = `ERROR:\n\n${error}\n\nPlease try to reconnect to your FitBit account in the app settings on your smartphone.`;
  } else {
    errorMessage = `ERROR:\n\n${error}`;
  }
  gui.alert(errorMessage);

}

function resetLastWeight() {

  let lastWeight, lastFat;

  if (weightsPast[0]) {
    lastWeight = weightsPast[0].weight || 75;
    lastFat = weightsPast[0].fat || 20
  } else {
    lastWeight = 75;
    lastFat = 20;
  }
  debug(`Setting last weight and fat tumblers: ${JSON.stringify(weightsPast[0])} / ${lastWeight} / ${lastFat}`);
  gui.initLastWeightFat(lastWeight, lastFat);

}

function retryMessaging () {

  let countResolved = 0;

  if (messageLog.length > 0) {

    for (let index = 0; index < messageLog.length; index++) {
      
      switch (messageLog[index]) {

        case KEYS.MESSAGE_POST_WEIGHTS_API:
          sendWeightLog();
          countResolved++;
          break;

        case KEYS.MESSAGE_REQUEST_WEIGHT_LOG_API:
          refreshWeightLog();
          countResolved++;
          break;    

      }
      
      messageLog[index] = "resolved";

    }

    for (let loop = 0; loop < countResolved; loop++) {
    
      for (let index = 0; index < messageLog.length; index++) {
      
        if ( messageLog[index] === "resolved" ) {
          messageLog.splice(index, 1);
          break;
        }
        
      }
      
    }

  }

}

function weightUnitChanged(newUnit) {

  // update module variable
  appSettings.weightUnit = newUnit;
  debug(`New unit selected: ${newUnit}`);

  // save new setting to device
  storage.saveSettings(appSettings);

  // reset display
  gui.setWeightUnit(appSettings.weightUnit);

}

function updateSpinner(addUUID, removeUUID) {

  // new spinner to be added
  if (addUUID) {
    asyncOngoing.push(addUUID);
    spinnerTimeOut(addUUID);
    debug(`Adding to spinner Array: ${asyncOngoing}`);
  }

  // spinner to be removed
  if (removeUUID) {
    debug(`Removing ${removeUUID} from spinner array ${asyncOngoing}`);
    for (let index = 0; index < asyncOngoing.length; index++) {
      if (asyncOngoing[index] === removeUUID) {
        asyncOngoing.splice(index,1);
        break;
      }
    }
  }

  // check if spinner to be started or ended
  if (asyncOngoing.length > 0 ) {
    debug(`Spinner array length ${asyncOngoing.length} - starting spinner`);
    gui.setSpinner(true);
  } else {
    debug(`Spinner array length ${asyncOngoing.length} - stopping spinner`);
    gui.setSpinner(false);
  }

}

async function spinnerTimeOut(uuid, time) {
// waits for a set amount of time and then stops the spinner regardless of result

  let waitTime = time || (30 * 1000);
  await utils.sleep(waitTime);

  updateSpinner(undefined,uuid);
  
}