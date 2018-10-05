import config from "./config";

const debug = text => {
  if (config.debug) {
    console.log(text);
  }
};

const error = text => {
  console.error(text);
};

export { debug, error };
