import React from "react";

import { timeParse } from "d3-time-format";
import { hexbin } from "d3-hexbin";
import { median, mean, variance, histogram } from "d3-array";
import { scaleSqrt, scaleTime, scaleLinear } from "d3-scale";
import { interpolateLab } from "d3-interpolate";
import styled, { keyframes } from "styled-components";

import { geoEqualEarth as projection } from "d3-geo";
//import { geoCylindricalStereographic as projection } from "d3-geo-projection";

import {
  GeoMap,
  HexBins,
  loadCountryGeoInfo,
  SvgToolTip,
  ThumbBar
} from "@ripe-rnd/ui-components";

import {
  loadProbesInfo,
  loadNewProbeInfo,
  loadRttForProbesData
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

const blip = keyframes`
    from: { transform: scale(1.0) translate(0,0); }
    50% { transform: scale(9.0) translate(0,0); }
    to { transform: scale(1.0) translate(0,0); }
`;

const StyledProbeStatusChanger = styled.circle`
  stroke-width: 0.2;
  //fill: ${props => (props.status === "connect" && "#00B213") || "#FF0050"};
  fill: none;
  stroke: ${props => (props.status === "connect" && "#00B213") || "#FF0050"};
  animation: ${blip} 1.6s ease-in 5;
`;

export class ProbeStatusChanger extends React.Component {
  render() {
    return (
      <g
        transform={`translate(${this.props.dx},${this.props.dy})`}
        style={{ transformOrigin: `${this.props.dx}px ${this.props.dy}px` }}
      >
        <StyledProbeStatusChanger
          //transformOrigin={`${this.props.dx}px ${this.props.dy}px`}
          r={1 / this.props.zoomFactor}
          status={this.props.status}
          dx={this.props.dx}
          dy={this.props.dy}
          vectorEffect="non-scaling-stroke"
        />
      </g>
    );
  }
}

export class ProbesHexbinMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      probes: null,
      countries: null,
      changedProbes: [], // these are all the new probe events from DOM ready
      lightProbes: [], // these are the most recent probe that need to be lighted
      webWorkerAvailability: true
    };
  }

  showToolTip = d => {
    const fontSize = 12,
      lineHeight = fontSize + 2,
      marginHor = 1.2 * fontSize,
      dx = 3.5 + 1.5 * marginHor,
      dy = 6 * lineHeight;
    this.setState({
      tooltip: (
        <SvgToolTip
          header={"PROBES"}
          x={d.x}
          y={d.y}
          dx={dx}
          dy={0}
          fontsize={fontSize}
          minwidth={165}
          extraHeight={180 + marginHor + ((d.moreNumber && 10) || 0)}
          zoomFactor={this.props.zoomFactor}
          textlines={[
            `connected : ${d.probes.filter(p => p[14] === 1).length}`,
            `disconnected : ${d.probes.filter(p => p[14] === 2).length}`,
            `AS diversity : ${d.simpsonIndex}`
          ]}
        >
          <ThumbBar
            dy={dy}
            bars={d.asDistribution}
            height={100}
            width={160 + marginHor}
            margin={marginHor}
            largestBarValue={d.largestBarValue}
            minBarHeight={1 / this.props.zoomFactor}
            countAttributes={[
              { attr: "t", color: "#FF0050" },
              { attr: "c", color: "#00B213" }
            ]}
          />
          {d.moreNumber && (
            <text transform={`translate(${marginHor}  274)`}>
              and {d.moreNumber} more...
            </text>
          )}
        </SvgToolTip>
      )
    });
  };

  hideToolTip = (d, i) => {
    this.setState({
      tooltip: null
    });
  };

  componentDidMount() {
    loadCountryGeoInfo().then(
      countries => {
        this.setState({ countries: countries });
      },
      error => {
        console.log("error");
        console.log(error);
        this.setState({ countries: null, error: "problems arose!" });
      }
    );

    loadProbesInfo().then(
      probesData => {
        console.log("probes data loaded...");

        if (this.props.dataAdapter) {
          this.props.dataAdapter().then(data => {
            const serializedData = this.props.dataSerializer(data, probesData);
            return this.setState({ probes: serializedData });
          });
        } else {
          this.setState({ probes: probesData });
        }

        // initialize probeUpdates webworker
        if (window.Worker) {
          const probeUpdater = new Worker("/worker.js");
          probeUpdater.onmessage = m => {
            const newProbeStatus = JSON.parse(m.data);
            let thisProbe = probesData.find(
              p => p[2] === newProbeStatus.prb_id
            );

            if (!thisProbe) {
              thisProbe = loadNewProbeInfo(newProbeStatus.prb_id).then(d => {
                const coords = this.props.projection([
                  d.geometry.coordinates[0],
                  d.geometry.coordinates[1]
                ]);
                return {
                  prb_id: d.id,
                  status: newProbeStatus.event,
                  ...coords
                };
              });
              console.log("new probe online!");
            } else {
              const updatedProbeIndex =
                this.state.probes &&
                this.state.probes.findIndex(p => p[2] === thisProbe[2]);
              thisProbe[14] =
                (newProbeStatus.event === "connect" && 1) ||
                (newProbeStatus.event === "disconnect" && 2) ||
                null;

              console.log("----------");
              console.log("new probe status");
              console.log(`prb_id: ${thisProbe[2]}`);
              console.log(`asn (v4) : ${thisProbe[3]}`);
              console.log(`asn (v6) : ${thisProbe[4]}`);
              console.log(`status: ${newProbeStatus.event}`);
              console.log("----------");

              this.setState({
                changedProbes: [
                  ...this.state.changedProbes,
                  {
                    prb_id: thisProbe[2],
                    status: newProbeStatus.event,
                    dx: thisProbe[0],
                    dy: thisProbe[1],
                    eventCount:
                      this.state.changedProbes.filter(
                        p => (p.prb_id = thisProbe[2])
                      ).length + 1
                  }
                ],
                lightProbes: [
                  {
                    prb_id: thisProbe[2],
                    status: newProbeStatus.event,
                    dx: thisProbe[0],
                    dy: thisProbe[1]
                  }
                ]
              });

              if (updatedProbeIndex > -1) {
                // window.probes = this.state.probes;
                this.setState({
                  probes: [
                    ...this.state.probes.slice(0, updatedProbeIndex),
                    thisProbe,
                    ...this.state.probes.slice(updatedProbeIndex + 1)
                  ]
                });
              }
            }
          };
        } else {
          this.setState({ webWorkerAvailability: false });
        }
      },
      error => {
        console.log("error");
        console.log(error);
        this.setState({ probes: null, error: "problems arose!" });
      }
    );
  }

  render() {
    return (
      <GeoMap
        viewMode="sheet"
        landFillColor="white"
        key="m1"
        id="map1"
        ref="map1"
        scale={235.0}
        width={1480}
        height={942}
        rotate={[0, 0]}
        translate={[740, 470]}
        projection={projection}
        countries={this.state.countries}
        maxZoomFactor={24}
      >
        {this.props.children({
          paths: this.state.probes,
          probeChangedEvents: this.state.changedProbes.length,
          width: this.props.width,
          height: this.props.height,
          showToolTip: this.showToolTip,
          hideToolTip: this.hideToolTip
        })}

        {this.state.changedProbes.length > 0 &&
          this.state.lightProbes.map((ps, i) => (
            <ProbeStatusChanger
              key={`ps_${ps.prb_id}_${ps.status}_${i}`}
              dx={ps.dx}
              dy={ps.dy}
              status={ps.status}
            />
          ))}
        {this.state.tooltip}
      </GeoMap>
    );
  }
}

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
        children={hexbinProps => (
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
