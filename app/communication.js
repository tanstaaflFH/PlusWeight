import * as messaging from "messaging";
import * as KEYS from "../common/identifier";
import { debug } from "../common/log";


function initMessage (callbackWeightsReceived, callbackWeightsPosted, callbackUnitChanged) {

    //set event handler on received message
    messaging.peerSocket.onmessage = evt => {
        
        debug(`App received message: ${JSON.stringify(evt, undefined, 2)}`);

        switch (evt.data.key) {

            case KEYS.MESSAGE_KEY_WEIGHTS_RETREIVED_API:

                callbackWeightsReceived(data);
                break;

            case KEYS.MESSAGE_KEY_WEIGHT_POSTED_API:

                callbackWeightsPosted(data);
                break;

            case KEYS.MESSAGE_KEY_SETTINGS_UNIT:

                callbackUnitChanged(data);
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
        debug(`Sent to companion: ${JSON.stringify(data, undefined, 2)}`);
      } catch (err) {
        error(`Exception when sending to companion`);
      }
    } else {
      error("Unable to send data to app");
    } 
}

export {
    initMessage,
    sendData
}