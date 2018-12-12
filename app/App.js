import React from "react";

import {
  AllProbesAggregatedMap,
  ProbesRttAsnAggregatedMap
} from "./geo/probesHexBinMaps";

const App = props => {
  return (
    <>
      <div>
        <AllProbesAggregatedMap />
      </div>
      {/* <div>
        <ProbesRttAsnAggregatedMap />
      </div> */}
    </>
  );
};

export default App;
