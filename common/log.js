import config from "./config";

const debug = text => {
  if (config.debug) {
    console.log(text);
  }
};

const error = text => {
  console.log(`ERROR: ${text}`);
};

export { debug, error };
