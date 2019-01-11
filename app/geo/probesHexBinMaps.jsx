import React from "react";
import { median, mean, variance, histogram } from "d3-array";
import { scaleSqrt, scaleTime, scaleLinear } from "d3-scale";
import { interpolateLab } from "d3-interpolate";

import { ProbesHexbinMap, HexBins } from "@ripe-rnd/ui-components";

import { loadRttForProbesData } from "@ripe-rnd/ui-datastores";

import { oimEmerald } from "@ripe-rnd/ui-components";

const calculateMinRttValue = p => {
  const v = p.reduce(
    (acc, next) => (next[16] < acc && next[16]) || acc,
    Infinity
  );
  return v;
};

const probesRttSerializer = (rttData, probesData) =>
  rttData
    .map(rttP => {
      const prb_id = probesData.find(p => p[2] === rttP.prb_id);
      // kick out probes that are now abandoned according to /all
      if (!prb_id) {
        return null;
      }
      return [...prb_id, (prb_id && rttP.min_rtt) || null];
    })
    .filter(p => p);

export class ProbesRttAsnAggregatedMap extends React.Component {
  render() {
    return (
      <ProbesHexbinMap
        dataAdapter={() => loadRttForProbesData(this.props.asn)}
        dataSerializer={probesRttSerializer}
        streamUpdates={false}
        apiServer={__API_SERVER__}
        render={hexbinsProps => {
          return (
            <HexBins
              {...hexbinsProps}
              stroke={p =>
                scaleLinear()
                  .domain([400, 10])
                  .range(["#FF0050", "#00B213"])
                  .interpolate(interpolateLab)(median(p, p => +p[16]))
              }
              hexbinColorRange={scaleLinear()
                .domain([50, 10, 0])
                .range(["#FF0050", "yellow", "#00B213"])
                .interpolate(interpolateLab)}
              hexbinBodyColorFunctor={calculateMinRttValue}
            />
          );
        }}
      />
    );
  }
}

export class AllProbesAggregatedMap extends React.Component {
  render() {
    return (
      <ProbesHexbinMap
        apiServer={__API_SERVER__}
        render={hexbinProps => (
          <HexBins
            {...hexbinProps}
            stroke={p =>
              scaleLinear()
                .domain([2, 1])
                .range(["#FF0050", "#00B213"])
                .interpolate(interpolateLab)(mean(p, p => +p[14]))
            }
            hexbinColorRange={scaleLinear()
              .domain([1, 0])
              .range(["#F4FFF5", oimEmerald])
              .interpolate(interpolateLab)}
          />
        )}
      />
    );
  }
}
