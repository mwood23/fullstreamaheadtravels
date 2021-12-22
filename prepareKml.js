const toGeoJSON = require("@tmcw/togeojson");
const fs = require("fs");
const DOMParser = require("xmldom").DOMParser;
const _ = require("lodash");

const writeLineString = (geoJson) => {
  const lineStrings = _.filter(
    geoJson.features,
    (f) => f.geometry.type === "LineString"
  );

  const sortedLineStrings = _.sortBy(lineStrings, (p) =>
    p.properties.name.toLowerCase()
  );

  let mergedCoordinates = [];
  sortedLineStrings.forEach((lineString, i) => {
    mergedCoordinates = mergedCoordinates.concat(
      lineString.geometry.coordinates
    );
  });

  const jsonToWrite = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "LineString", coordinates: mergedCoordinates },
        properties: {
          name: "Our path",
        },
      },
    ],
  };

  fs.writeFileSync(
    "./src/line-string.json",
    JSON.stringify(jsonToWrite, null, 2)
  );
};

const writeDestinations = (geoJson) => {
  const features = [];

  for (let index = 0; index < geoJson.features.length; index++) {
    const element = geoJson.features[index];
    if (element.geometry.type === "LineString") {
      break;
    }

    features.push(element);
  }

  const jsonToWrite = {
    type: "FeatureCollection",
    features,
  };

  fs.writeFileSync(
    "./src/destinations.json",
    JSON.stringify(jsonToWrite, null, 2)
  );
};

const prepareKml = () => {
  const kml = new DOMParser().parseFromString(
    fs.readFileSync("FullStreamAheadTravels.kml", "utf8")
  );

  const geoJson = toGeoJSON.kml(kml);

  console.log(geoJson);

  writeLineString(geoJson);
  writeDestinations(geoJson);

  fs.writeFileSync("./src/raw.json", JSON.stringify(geoJson, null, 2));
};

prepareKml();
