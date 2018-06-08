import React from "react";

import { timeParse } from "d3-time-format";
import { hexbin } from "d3-hexbin";
import { select, selectAll } from "d3-selection";
import { median, mean, variance, histogram } from "d3-array";
import { scaleSqrt, scaleTime, scaleLinear } from "d3-scale";
import { interpolateLab } from "d3-interpolate";
import styled, { keyframes } from "styled-components";

import { geoRobinson as projection } from "d3-geo-projection";

import {
  GeoMap,
  loadCountryGeoInfo,
  SvgToolTip
} from "@ripe-rnd/ui-components";

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

export const loadProbesInfo = async ({ ...props }) => {
  /* django doesn't get any faster than this.
  * The super-secret undocumented /probes/all call.
  * 
  * input format:
  *  [
  *   0           probe.pk,
  *   1           probe.asn_v4 if probe.asn_v4 else 0,
  *   2           probe.asn_v6 if probe.asn_v6 else 0,
  *   3           probe.prb_country_code.code,
  *   4           1 if probe.is_anchor else 0,
  *   5           1 if probe.prb_public else 0,
  *   6          lat,
  *   7          lng,
  *   8           probe.prefix_v4 if probe.prefix_v4 else 0,
  *   9           probe.prefix_v6 if probe.prefix_v6 else 0,
  *   10          probe.address_v4 if probe.prb_public and probe.address_v4 else 0,
  *   11           probe.address_v6 if probe.prb_public and probe.address_v6 else 0,
  *   12          probe.status,
  *   13         int(probe.status_since.strftime("%s")) if probe.status_since is not None else None
  *  ]
  * 
  * Now, no matter what you try, d3 will want to use the first to elements in this array MUTABLY
  * for its x,y coordinates. So we're outputting the array from index 2, thereby reserving for 0,1
  * for d3 weirdness.
  * 
  * output format:
  *  [
  *     d3X, d3Y, ...rest of the input array
  *  ]
  */

  const fetchUrl = "https://atlas-ui1.atlas.ripe.net/api/v2/probes/all";

  let response = await fetch(fetchUrl).catch(err => {
    console.log(err);
    console.log(`${fetchUrl} does not exist.`);
  });
  let probesData = await response.json().catch(error => {
    console.log("error loading geographic information (topojson)");
    console.log(error);
    return null;
  });
  // yes, there are probes with location NULL, so kick those out.
  return probesData.probes
    .filter(p => p[6] && p[7])
    .map(p => [null, null, ...p]);
};

export const loadNewProbeInfo = async prb_id => {
  const fetchUrl = `https://atlas.ripen.net/api/v2/${prb_id}`;
  let reponse = await fetch(fetchUrl).catch(err => {
    console.log(err);
    console.log(`${fetchUrl} does not exist.`);
  });
  let probeData = await response.json().catch(error => {
    console.log("error loading probe info from atlas");
    console.log(error);
    return null;
  });
  // return empty if there's no geolocation data
  return (probeData.geometry && probeData) || {};
};

export const transformProbesData = (probesData, projection) => {
  return probesData.map(d => {
    const p = projection([d[9], d[8]]);
    //d[14] = d.slice(0, 1)[0];
    //d.prb_id = d.slice(0,1); // copy first element, otherwise D3 will f*ck your
    //(d[0] = p[0]), (d[1] = p[1]);
    [d[0], d[1]] = p.slice(0, 2);
    d.date = timeParse("%s")(d[15]);
    //d.unshift(p[0], p[1]);
    return d;
  });
};

const calculateSimpsonIndex = p => {
  const asDistribution = p.reduce((acc, next) => {
    const asn = next[3] || next[4] || 0;
    acc[asn] = (acc[asn] && acc[asn] + 1) || 1;
    return acc;
  }, {});
  return Object.keys(asDistribution)
    .filter(as => as !== "0")
    .reduce(
      (acc, next) => acc + Math.pow(asDistribution[next] / p.length, 2),
      0
    );
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
        >
          {/* <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="scale"
            from="1.0"
            to="9.0"
            dur="3s"
            repeatCount="indefinite"
          /> */}
        </StyledProbeStatusChanger>
      </g>
    );
  }
}

export class ProjectedPaths extends React.PureComponent {
  constructor(props) {
    super(props);
    this.paths = [];

    this.calculateHexBin();

    // this.color = scaleTime()
    //   .domain([
    //     timeParse("%s")((Date.now() / 1000).toFixed(0) - 86400),
    //     timeParse("%s")((Date.now() / 1000).toFixed(0) - 864000)
    //   ])
    //   .range(["black", "green"])
    //   .interpolate(interpolateLab);
    this.color = scaleLinear()
      .domain([2, 1])
      .range(["#FF0050", "#00B213"])
      .interpolate(interpolateLab);

    this.asColor = scaleLinear()
      .domain([1, 0])
      .range(["#F4FFF5", oimEmerald])
      .interpolate(interpolateLab);

    this.state = {
      pathsInitialized: false
    };
  }

  calculateHexBin(zoomFactor = 1) {
    this.hexbin = hexbin()
      .extent([[0, 0], [this.props.width, this.props.height]])
      // radius of catchment area, so probes within this radius end up
      // in one hexbin.
      .radius(8.5 / zoomFactor);

    // map number of probes in hexbin to the size
    // of the hexbin on screen
    this.radius = scaleSqrt()
      .domain([2, 1000])
      .range([4 / zoomFactor, 1 + 11.5 / zoomFactor]);
  }

  componentDidMount() {
    if (this.props.paths) {
      console.log("Awas! fast paths loading!");

      this.paths = hexbin(
        transformProbesData(this.props.paths, this.props.projection)
      ).sort((a, b) => b.length - a.length);

      //this.renderD3Paths({ update: false });
    }

    this.setState({ pathsInitialized: true });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.paths && !this.props.paths) {
      console.log("paths received");
      this.paths = this.hexbin(
        transformProbesData(nextProps.paths, this.props.projection)
      ).sort((a, b) => b.length - a.length);
      this.setState({ pathsInitialized: true });
    }

    if (nextProps.zoomFactor !== this.props.zoomFactor) {
      console.log("zoomert on paths");
      console.log(`zoomFactor : ${nextProps.zoomFactor}`);
      this.calculateHexBin(nextProps.zoomFactor);
      this.paths = this.hexbin(
        transformProbesData(nextProps.paths, this.props.projection)
      ).sort((a, b) => b.length - a.length);
    }
  }

  render() {
    return (
      <g>
        {this.paths &&
          this.paths.map(p => {
            const asDistribution = p.reduce((acc, next) => {
                const asn = next[3] || next[4] || 0;
                acc[asn] = (acc[asn] && acc[asn] + 1) || 1;
                return acc;
              }, {}),
              asDensity = calculateSimpsonIndex(p),
              singleProbeScale = ` scale(
               ${Math.min(1.4, 2.4 / this.props.zoomFactor)})`,
              hexBinScale = " scale(1.0)";
            return (
              <path
                className="hexagon"
                key={`h_${p.x}_${p.y}`}
                d={
                  (p.length > 1 &&
                    this.hexbin.hexagon(this.radius(p.length))) ||
                  "M 0,0 a 1,1 0 1,0 2,0 a 1,1 0 1,0 -2,0"
                }
                transform={`translate(${(p.length > 1 && p.x) ||
                  p[0][0]},${(p.length > 1 && p.y) || p[0][1]})${(p.length >
                  1 &&
                  hexBinScale) ||
                  singleProbeScale}`}
                //fill={this.color(median(p, p => +p.date))}
                //fill={this.color(mean(p, p => +p[14]))}
                fill={
                  ((p.length > 1 || p[0][14] !== 2) &&
                    this.asColor(asDensity)) ||
                  "none"
                }
                stroke={this.color(mean(p, p => +p[14]))}
                strokeWidth={
                  (p.length > 1 && this.radius(p.length) / 5) || "0.2"
                }
              />
            );
          })}
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
      changedProbes: [],
      webWorkerAvailability: true
    };
  }

  componentDidMount() {
    const countries = loadCountryGeoInfo().then(
      countries => {
        this.setState({ countries: countries });
      },
      error => {
        console.log("error");
        console.log(error);
        this.setState({ countries: null, error: "problems arose!" });
      }
    );

    const probesData = loadProbesInfo().then(
      probesData => {
        console.log("probes data loaded...");
        this.setState({ probes: probesData });

        // initialize probeUpdates webworker
        if (window.Worker) {
          const probeUpdater = new Worker("./worker.js");
          probeUpdater.onmessage = m => {
            console.log(m.data);
            console.log(probesData[0][3]);
            const newProbeStatus = JSON.parse(m.data);
            let thisProbe = probesData.find(
              p => p[2] === newProbeStatus.prb_id
            );

            console.log(newProbeStatus);
            console.log(thisProbe);
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
              this.setState({
                changedProbes: [
                  ...this.state.changedProbes,
                  {
                    prb_id: thisProbe[2],
                    status: newProbeStatus.event,
                    dx: thisProbe[0],
                    dy: thisProbe[1]
                  }
                ]
              });
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
        <ProjectedPaths
          paths={this.state.probes}
          width={this.props.width}
          height={this.props.height}
        />

        {this.state.changedProbes.length > 0 &&
          this.state.changedProbes.map(ps => (
            <ProbeStatusChanger dx={ps.dx} dy={ps.dy} status={ps.status} />
          ))}
      </GeoMap>
    );
  }
}
