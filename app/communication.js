import * as messaging from "messaging";
import { alert, log, setNoCompanion, setSpinner } from "../app/gui";
import * as KEYS from "../common/identifier";
import { debug, error } from "../common/log";

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

                log(`Companion could not retrieve the weight log from the web. ${evt.data.content}`);
                callbackFailure(evt.data.content, evt.data.uuid);
                break;

            case KEYS.MESSAGE_POST_SUCCESS_API:
            // companion has sent the result after weights have been posted to the web

                callbackWeightsPosted(evt.data.content, evt.data.uuid);
                break;

            case KEYS.MESSAGE_POST_FAILURE_API:

                log(`Companion could not post any weight data.`);
                callbackFailure(evt.data.content, evt.data.uuid);
                break;

            case KEYS.MESSAGE_UNIT_SETTING_CHANGED:

                callbackUnitChanged(evt.data.content);
                break;

        }

    };

    // Message socket opens
    messaging.peerSocket.onopen = () => {
        log("App Socket Open");
        setNoCompanion(false);
        callbackOpenMessages();
    };
    
    // Message socket closes
    messaging.peerSocket.onclose = () => {
        log("App Socket Closed");
        setNoCompanion(true);
        setSpinner(false);
    };

    // Problem with message socket
    messaging.peerSocket.onerror = err => {
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
        alert(`Exception when sending to companion`);
        setNoCompanion(true);
        setSpinner(false);
        callback(identifier, data);
      }
    } else {
      error("Unable to send data to companion, socket not open.");
      setNoCompanion(true);
      setSpinner(false);
      callback(identifier, data);
    } 
}

function messageState() {
    
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        return true;
    } else {
        return false;
    }

}

export { initMessage, sendData, messageState };

