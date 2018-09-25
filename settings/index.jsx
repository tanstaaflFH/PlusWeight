import { debug } from "../common/log.js";

import secrets from "../secrets.json";

const generateSettings = props => (
  <Page>
    <Section title={<Text>Log in with your Fitbit account</Text>}>
      <Oauth
        settingsKey="oauth"
        title="Login"
        label="Fitbit"
        status={(() => {
          if (props.settingsStorage.getItem("oauth")) {
            return "Authenticated";
          } else {
            return "Not authenticated";
          }
        })()}
        authorizeUrl="https://www.fitbit.com/oauth2/authorize"
        requestTokenUrl="https://api.fitbit.com/oauth2/token"
        clientId={secrets.settings.clientId}
        clientSecret={secrets.settings.clientSecret}
        scope="weight"
        onAccessToken={async data => {
          debug("Token: " + JSON.stringify(data));
        }}
      />
    </Section>
    <Section title="Units to use for weight">
       <Select
         label="Unit"
         settingsKey="unit"
         options={[
          {name: "kg"},
          {name: "pounds"},
          {name: "stone"}
         ]}
         selectViewTitle="Choose a unit"
        />
    </Section>
  </Page>
);

registerSettingsPage(generateSettings);
