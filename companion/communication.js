import * as messaging from "messaging";
import * as KEYS from "../common/identifier";
import { debug, error } from "../common/log";


function initMessage (callbackWeightsPosted, callbackWeightLogRequested) {

    //set event handler on received message
    messaging.peerSocket.onmessage = evt => {
        
        debug(`Companion received message: ${JSON.stringify(evt, undefined, 2)}`);

        switch (evt.data.key) {

            case KEYS.MESSAGE_REQUEST_WEIGHT_LOG_API:
            // app has sent a request to retrieve the weight log from the web

                callbackWeightLogRequested(evt.data.uuid);
                break;

            case KEYS.MESSAGE_POST_WEIGHTS_API:
            // app has sent some weights to be posted to the web

                callbackWeightsPosted(evt.data.content, evt.data.uuid);
                break;

        }
    };

    // Message socket opens
    messaging.peerSocket.onopen = () => {
        debug("App Socket Open");
    };
    
    // Message socket closes
    messaging.peerSocket.onclose = () => {
        debug("App Socket Closed");
    };

    // Problem with message socket
    messaging.peerSocket.onerror = err => {
        error("Connection error: " + err.code + " - " + err.message);
    };
}

function sendData(data) {
// Send data to companion using Messaging API

    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      try {
        messaging.peerSocket.send(data);
        debug(`Sent to app: ${JSON.stringify(data, undefined, 2)}`);
      } catch (err) {
        error(`Exception when sending to app`);
      }
    } else {
      error("Unable to send data to app");
    } 
}

export { initMessage, sendData };
