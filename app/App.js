import React from "react";

import { Map } from "./geo/map.jsx";
import { ProbesHexbinMap } from "./geo/probes.central_asia.jsx";
// import { ProbesHexbinMap } from "./geo/probes.jsx";

const App = (props) => {
  return (
    <div>
      <ProbesHexbinMap />
    </div>
  );
};

export default App;
