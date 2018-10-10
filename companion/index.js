import { settingsStorage } from "settings";
import * as KEYS from "../common/identifier";
import { debug } from "../common/log";
import * as communication from "./communication";
import * as webAPI from "./webAPI";

let userUTCOffset = settingsStorage.getItem(KEYS.SETTINGS_KEY_OTC_OFFSET) || {
  raw: 0,
  sign: "",
  hoursString: "00",
  minutesString: "00"
};

// other functions
async function updateUserUTCOffset() {

  try {
    const userProfile = await webAPI.fetchProfileData();
    userUTCOffset = userProfile.data.offsetFromUTCMillis;
    settingsStorage.setItem(KEYS.SETTINGS_KEY_OTC_OFFSET, userUTCOffset);
    debug(`New user UTC offset: ${userUTCOffset}`);
  } catch (error) {
    debug(`Could not update the UTC offset from the user profile`);
  }

}

//callback functions
async function requestWeightLog(uuid) {

  await updateUserUTCOffset();

  webAPI.fetchWeightData(userUTCOffset).then(
    result => {
      debug("receivedWeightLog: " + JSON.stringify(result.data));
      communication.sendData({key: KEYS.MESSAGE_RETRIEVE_SUCCES_API, content: result.data, uuid: uuid});
    }
  ).catch(err => {
      debug('[Error in requestWeightLog]: ' + JSON.stringify(err,undefined,2));
      communication.sendData({key: KEYS.MESSAGE_RETRIEVE_FAILURE_API, content: `${err.data}`, uuid: uuid});
    }
  );

}

async function postNewWeights(newWeightsData, uuid) {

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
    await webAPI.postWeightData(newWeightsData[index]).then(
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
    communication.sendData({key: KEYS.MESSAGE_POST_SUCCESS_API, content:resolved, uuid: uuid});
  } else {
    communication.sendData({key: KEYS.MESSAGE_POST_FAILURE_API, content:KEYS.ERROR_API_POST_WEIGHT_LOG, uuid: uuid});
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