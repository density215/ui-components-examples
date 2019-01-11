import React from "react";

import {
  AllProbesAggregatedMap,
  ProbesRttAsnAggregatedMap
} from "./probesHexBinMaps.jsx";

const url_as_frag = window.location.pathname.match(/\/as\/(\d+)/),
  asn = url_as_frag && url_as_frag[1];

export class MapsContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      worldMap: <AllProbesAggregatedMap />
    };
  }

  showAllAggregatedProbes = e => {
    e.preventDefault();
    this.setState({
      worldMap: <AllProbesAggregatedMap />
    });
  };

  showProbesRttAsnAggregatedMap = e => {
    e.preventDefault();
    this.setState({
      worldMap: (
        <ProbesRttAsnAggregatedMap asn={asn} />
      )
    });
  };

  render() {
    return (
      <>
        <div>
          <h5>MAPS</h5>
          <div>
            <a href="" onClick={this.showAllAggregatedProbes}>
              All probes
            </a>
          </div>
          <div>
            <a href="" onClick={this.showProbesRttAsnAggregatedMap}>
              RTTs to an autonomous system
            </a>
          </div>
        </div>
        {this.state.worldMap}
      </>
    );
  }
}
