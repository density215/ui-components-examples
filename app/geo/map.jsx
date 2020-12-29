import React from "react";

import {
    geoWinkel3 as projectionType5,
    geoEckert3 as projectionType2,
    geoRobinson as projectionType3,
    geoCylindricalStereographic as projectionType4
} from "d3-geo-projection";

import { geoOrthographic as projectionType1 } from "d3-geo";

import { GeoMap } from "@ripe-rnd/ui-components";
import { loadCountryGeoInfo } from "@ripe-rnd/ui-datastores";

export class Map extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            countries: null
        };
    }

    componentDidMount() {
        const countries = loadCountryGeoInfo().then(
            countries => this.setState({ countries: countries }),
            error => {
                console.log("error");
                console.log(error);
                this.setState({ countries: null, error: "problems arose!" });
            }
        );
        const smallCountries = loadCountryGeoInfo({
            detail: "110m",
            places: null
        }).then(
            countries => this.setState({ smallCountries: countries }),
            error => {
                console.log("error");
                console.log(error);
                this.setState({
                    countries: null,
                    error: "no small countries loaded"
                });
            }
        );
    }

    render() {
        return [
            <GeoMap
                viewMode="sheet"
                key="m1"
                id="map1"
                scale={235.0}
                width={1480}
                height={942}
                rotate={[0, 0]}
                translate={[740, 470]}
                //rotate={[0, 0]}
                //translate={[0, 460]}
                projection={projectionType4}
                countries={this.state.countries}
                //loadCountryGeoInfo={this.loadCountryGeoInfo}
            />,
            <GeoMap
                viewMode="window"
                key="m2"
                id="map2"
                scale={270.0}
                width={1480}
                height={942}
                rotate={[0, 0]}
                translate={[740, 470]}
                //rotate={[0, 0]}
                //translate={[0, 460]}
                projection={projectionType2}
                countries={this.state.countries}
                //loadCountryGeoInfo={this.loadCountryGeoInfo}
            />,
            <GeoMap
                viewMode="window"
                key="m3"
                id="map3"
                scale={225.0}
                width={1480}
                height={942}
                rotate={[0, 0]}
                translate={[740, 470]}
                projection={projectionType1}
                countries={this.state.countries}
                showAntarctica={true}
            />,
            <GeoMap
                viewMode="window"
                key="m4"
                id="map4"
                scale={235.0}
                width={1480}
                height={942}
                rotate={[0, 0]}
                translate={[740, 470]}
                projection={projectionType5}
                countries={this.state.countries}
                showAntarctica={true}
            />,
            <GeoMap
                viewMode="popup"
                key="pp1"
                id="map5"
                scale={50.0}
                width={296}
                height={188}
                rotate={[0, 0]}
                translate={[148, 94]}
                projection={projectionType3}
                countries={this.state.smallCountries}
                showGraticules={false}
                showAntarctica={false}
                showBackground={false}
            />,
            <GeoMap
                viewMode="popup"
                key="pp2"
                id="map6"
                scale={50.0}
                width={296}
                height={188}
                rotate={[0, 0]}
                translate={[148, 94]}
                projection={projectionType1}
                countries={this.state.smallCountries}
                showGraticules={false}
            />
        ];
    }
}
