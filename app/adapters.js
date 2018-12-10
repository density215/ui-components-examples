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
   *     d3X, d3Y, ...rest of the input array (so all the indexes + 2)
   *  ]
   */

  const fetchUrl = "https://atlas.ripe.net/api/v2/probes/all";

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
  const fetchUrl = `https://atlas.ripe.net/api/v2/probes/${prb_id}`;
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

export const loadRttForProbesData = async asn => {
  const fetchUrl = `https://sg-pub.ripe.net/emile/min-rtt/${asn}.json`;

  let response = await fetch(fetchUrl).catch(err => {
    console.log(err);
    console.log(`${fetchUrl} does not exist.`);
  });
  let rttData = await response.json().catch(error => {
    console.log("error loading probes rtt data");
    console.log(error);
    return null;
  });
  // yes, there are probes with location NULL, so kick those out.
  return rttData;
};
