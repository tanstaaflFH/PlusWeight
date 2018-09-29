import {debug} from "../common/log";
import { settingsStorage } from "settings";
import * as weightAPI from "./weightAPI";
import * as clsWeight from "../common/weight";
import * as communication from "./communication";
import * as KEYS from "../common/identifier";

//callback functions
function requestWeightLog() {

  weightAPI.fetchWeightData().then(
    function(result) {
      debug("receivedWeightLog: " + JSON.stringify(result));
      communication.sendData({key: KEYS.MESSAGE_RECEIVED_WEIGHT_LOG_API, content: result});
    }
  ).catch(err => debug('[Error in requestWeightLog]: ' + err));

}

async function postNewWeights(newWeightsData) {

  // clean up the date objects
  for (let index = 0; index < newWeightsData.length; index++) {
    if (newWeightsData[index]) {
      newWeightsData[index].date = new Date(newWeightsData[index].date);
    }
  }
  
  let resolved = [];
  for (let index = 0; index < newWeightsData.length; index++) {
    await weightAPI.postWeightData(newWeightsData[index]).then(
      function(result) {
        debug("successfully posted new weight: " + JSON.stringify(result));
        resolved.push(index);
      }
    ).catch(err => debug('[Error in postNewWeights]: ' + err));
  }

  debug(`Posted the following array entries ${resolved}`);
  communication.sendData({key: KEYS.MESSAGE_POST_SUCCESS_API, content:resolved});
}

communication.initMessage(postNewWeights, requestWeightLog);

  // A user changes Settings
settingsStorage.onchange = evt => {

  switch ( evt.key ) {

    case KEYS.SETTINGS_KEY_OAUTH:
      // Settings page sent us an oAuth token --> refetch the existing weight data and store key
      let data = JSON.parse(evt.newValue);
      settingsStorage.setItem(KEYS.SETTINGS_KEY_OAUTH, JSON.stringify(data));
      requestWeightLog();
      break;

    case KEYS.SETTINGS_KEY_UNIT:
      // Settings page sent us a new weight unit --> store setting and send new key to app
      // only used for display --> all data is internally treated and transmitted with kg

      const newValue = JSON.parse(evt.newValue).values[0].name;
      if (!evt.oldValue) {
        communication.sendData({key: KEYS.MESSAGE_UNIT_SETTING_CHANGED, content: newValue});
        return;
      }

      const oldValue = JSON.parse(evt.oldValue).values[0].name;
      if (!oldValue || newValue != oldValue) {
        communication.sendData({key: KEYS.MESSAGE_UNIT_SETTING_CHANGED, content: newValue});
      }

  }

};