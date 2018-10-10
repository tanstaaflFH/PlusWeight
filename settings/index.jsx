import { debug } from "../common/log.js";
import { UNITS } from "../common/identifier.js";
import secrets from "../secrets";

const generateSettings = props => (
  <Page>
    <Section title={<Text>Log in with your Fitbit account</Text>}>
      <Oauth
        settingsKey="OAUTH"
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
        scope="weight profile"
        onAccessToken={async data => {
          debug("Token: " + JSON.stringify(data));
        }}
      />
    </Section>
    <Section title="Units to use for weight">
       <Select
         label="Unit"
         settingsKey="UNIT"
         options={[
          {name: UNITS.other},
          {name: UNITS.US}
         ]}
         selectViewTitle="Choose a unit"
        />
    </Section>
  </Page>
);

registerSettingsPage(generateSettings);
