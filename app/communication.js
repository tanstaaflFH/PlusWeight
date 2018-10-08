import * as messaging from "messaging";
import * as KEYS from "../common/identifier";
import { debug, error } from "../common/log";
import { alert } from "../app/gui";

function initMessage (callbackWeightsReceived, callbackWeightsPosted, callbackUnitChanged, callbackOpenMessages, callbackFailure) {

    //set event handler on received message
    messaging.peerSocket.onmessage = evt => {
        
        debug(`App received message: ${JSON.stringify(evt.data.content, undefined, 2)}`);

        switch (evt.data.key) {

            case KEYS.MESSAGE_RETRIEVE_SUCCES_API:
            // companion has sent Weight log retrieved from web

                callbackWeightsReceived(evt.data.content, evt.data.uuid);
                break;

            case KEYS.MESSAGE_RETRIEVE_FAILURE_API:

                debug(`Companion could not retrieve the weight log from the web. ${evt.data.content}`);
                callbackFailure(evt.data.content, evt.data.uuid);
                break;

            case KEYS.MESSAGE_POST_SUCCESS_API:
            // companion has sent the result after weights have been posted to the web

                callbackWeightsPosted(evt.data.content, evt.data.uuid);
                break;

            case KEYS.MESSAGE_POST_FAILURE_API:

                debug(`Companion could not post any weight data.`);
                callbackFailure(evt.data.content, evt.data.uuid);
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
        alert("Connection error: " + err.code + " - " + err.message);
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
        alert(`Exception when sending to companion`);
      }
    } else {
      error("Unable to send data to companion, socket not open.");
      alert("Unable to send data to companion, socket not open.");
      callback(identifier, data);
    } 
}

export {
    initMessage,
    sendData
}