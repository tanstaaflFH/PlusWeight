import * as messaging from "messaging";
import * as KEYS from "../common/identifier";
import { debug, error } from "../common/log";

function initMessage (callbackWeightsReceived, callbackWeightsPosted, callbackUnitChanged, callbackOpenMessages) {

    //set event handler on received message
    messaging.peerSocket.onmessage = evt => {
        
        debug(`App received message: ${JSON.stringify(evt.data.content, undefined, 2)}`);

        switch (evt.data.key) {

            case KEYS.MESSAGE_RECEIVED_WEIGHT_LOG_API:
            // companion has sent Weight log retrieved from web

                callbackWeightsReceived(evt.data.content);
                break;

            case KEYS.MESSAGE_POST_SUCCESS_API:
            // companion has sent the result after weights have been posted to the web

                callbackWeightsPosted(evt.data.content);
                break;

            case KEYS.MESSAGE_UNIT_SETTING_CHANGED:

                callbackUnitChanged(evt.data.content);
                break;

        }

    };

    // Message socket opens
    messaging.peerSocket.onopen = () => {
        debug("App Socket Open");
        callbackOpenMessages();
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

function sendData(data, identifier, callback) {
// Send data to companion using Messaging API

    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      try {
        messaging.peerSocket.send(data);
        debug(`Sent to companion: ${JSON.stringify(data, undefined, 2)}`);
      } catch (err) {
        error(`Exception when sending to companion`);
      }
    } else {
      error("Unable to send data to companion, socket not open.");
      callback(identifier);
    } 
}

export {
    initMessage,
    sendData
}