import {debug} from "../common/log";
import { settingsStorage } from "settings";
import * as weightAPI from "./weightAPI";
import * as clsWeight from "../common/weight";

let now = new Date();
let testWeight = new clsWeight.Weight(now, 70.1, 20);


  // A user changes Settings
settingsStorage.onchange = evt => {
    if (evt.key === "oauth") {
      // Settings page sent us an oAuth token --> refetch the existing weight data
      let data = JSON.parse(evt.newValue);
      let webWeights = weightAPI.fetchWeightData(data.access_token);
      /*if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        messaging.peerSocket.send(webWeights);
        debug("Sent new web weight data to device.");
      }*/
      weightAPI.postWeightData(testWeight, data.access_token);
    }
  };