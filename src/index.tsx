import { render } from "react-dom";

import {
  AppExtensionSDK,
  PageExtensionSDK,
  init,
  locations,
} from "@contentful/app-sdk";
import { QueryClient, QueryClientProvider } from "react-query";
import "@contentful/forma-36-react-components/dist/styles.css";
import "@contentful/forma-36-fcss/dist/styles.css";
import "@contentful/forma-36-tokens/dist/css/index.css";
import "./index.css";

import Config from "./components/ConfigScreen";
import Page from "./components/Page";

import LocalhostWarning from "./components/LocalhostWarning";

if (process.env.NODE_ENV === "development" && window.self === window.top) {
  // You can remove this if block before deploying your app
  const root = document.getElementById("root");
  render(<LocalhostWarning />, root);
} else {
  init((sdk) => {
    const root = document.getElementById("root");

    const queryClient = new QueryClient();

    const App: React.FC = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const ComponentLocationSettings = [
      {
        location: locations.LOCATION_APP_CONFIG,
        component: (
          <App>
            <Config sdk={sdk as AppExtensionSDK} />
          </App>
        ),
      },
      {
        location: locations.LOCATION_PAGE,
        component: (
          <App>
            <Page sdk={sdk as PageExtensionSDK} />
          </App>
        ),
      },
    ];

    // Select a component depending on a location in which the app is rendered.
    ComponentLocationSettings.forEach((componentLocationSetting) => {
      if (sdk.location.is(componentLocationSetting.location)) {
        render(componentLocationSetting.component, root);
      }
    });
  });
}
