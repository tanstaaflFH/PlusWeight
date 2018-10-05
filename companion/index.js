import {debug} from "../common/log";
import { settingsStorage } from "settings";
import * as weightAPI from "./weightAPI";
import * as clsWeight from "../common/weight";
import * as communication from "./communication";
import * as KEYS from "../common/identifier";

//callback functions
function requestWeightLog() {

  weightAPI.fetchWeightData().then(
    result => {
      debug("receivedWeightLog: " + JSON.stringify(result.data));
      communication.sendData({key: KEYS.MESSAGE_RETRIEVE_SUCCES_API, content: result.data});
    }
  ).catch(err => {
      debug('[Error in requestWeightLog]: ' + JSON.stringify(err,undefined,2));
      communication.sendData({key: KEYS.MESSAGE_RETRIEVE_FAILURE_API, content: `${err.data}`});
    }
  );

}

async function postNewWeights(newWeightsData) {

  // clean up the date objects
  for (let index = 0; index < newWeightsData.length; index++) {
    if (newWeightsData[index]) {
      newWeightsData[index] = JSON.parse(newWeightsData[index]);
      newWeightsData[index].date = new Date(newWeightsData[index].date);
    }
  }
  
  // do one POST for each entry of the array with logs to be posted
  let resolved = [];
  for (let index = 0; index < newWeightsData.length; index++) {
    await weightAPI.postWeightData(newWeightsData[index]).then(
      result => {
        debug("successfully posted new weight: " + JSON.stringify(result));
        resolved.push(newWeightsData[index].logID);
      }
    ).catch(
      err => debug('[Error in postNewWeights]: ' + JSON.stringify(err,undefined,2))
    );
  }

  debug(`Posted the following array entries ${resolved}`);
  if (resolved.length > 0) {
    communication.sendData({key: KEYS.MESSAGE_POST_SUCCESS_API, content:resolved});
  } else {
    communication.sendData({key: KEYS.MESSAGE_POST_FAILURE_API, content:KEYS.ERROR_API_POST_WEIGHT_LOG});
  }
}

communication.initMessage(postNewWeights, requestWeightLog);

settingsStorage.onchange = evt => {
// A user changes Settings

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