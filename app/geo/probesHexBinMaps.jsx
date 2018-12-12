import React from "react";

import { timeParse } from "d3-time-format";
import { hexbin } from "d3-hexbin";
import { median, mean, variance, histogram } from "d3-array";
import { scaleSqrt, scaleTime, scaleLinear } from "d3-scale";
import { interpolateLab } from "d3-interpolate";
import styled, { keyframes } from "styled-components";

import { geoEqualEarth as projection } from "d3-geo";
//import { geoCylindricalStereographic as projection } from "d3-geo-projection";

import { ProbesHexbinMap, HexBins } from "@ripe-rnd/ui-components";

import {
  loadProbesInfo,
  loadNewProbeInfo,
  loadRttForProbesData,
  loadCountryGeoInfo
  // transformProbesData
} from "../adapters";

import {
  ripeMagenta,
  atlasGreen,
  oimCarrot,
  oimClouds,
  oimLand,
  oimEmerald,
  oimAntracite,
  lColor
} from "@ripe-rnd/ui-components";

const url_as_frag = window.location.pathname.match(/\/as\/(\d+)/),
  asn = url_as_frag && url_as_frag[1];

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
        dataAdapter={() => loadRttForProbesData(asn)}
        dataSerializer={probesRttSerializer}
        streamUpdates={false}
        children={hexbinsProps => {
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
