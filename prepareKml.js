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

  // This is hacky but it doesn't pick up moments because it's after the line string in the KML file
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

const writeMoments = (geoJson) => {
  const features = [];

  let take = false;
  for (let index = 0; index < geoJson.features.length; index++) {
    const element = geoJson.features[index];
    if (element.geometry.type === "LineString") {
      take = true;
      continue;
    }
    if (take === false) continue;

    if (element.properties["icon-color"] === "#0288d1") {
      if (element.properties.description) {
        const [iconAbbreviation, description] =
          element.properties.description.split(",");
        let icon = "";

        switch (iconAbbreviation) {
          case "pizza":
            icon = "restaurant-pizza-15";
            break;
          case "nationalPark":
            icon = "mountain-15";
            break;
          case "coffee":
            icon = "cafe-15";
            break;
          case "laundry":
            icon = "laundry-15";
            break;
          case "moment":
          case "hike":
            icon = "viewpoint-15";
            break;
          case "attraction":
            icon = "stadium-15";
            break;
          case "gas":
            icon = "fuel-15";
            break;
          case "photo":
            icon = "attraction-15";
            break;
          case "food":
            icon = "alcohol-shop-15";
            break;
          case "casino":
            icon = "casino-15";
            break;
          case "store":
            icon = "grocery-15";
            break;
          case "library":
            icon = "library-15";
            break;
          case "campsite":
            icon = "campsite-15";
            break;
          case "bike":
            icon = "bicycle-share-15";
            break;
          case "special":
            icon = "star-stroked-15";
            break;

          default:
            throw new Error(
              `Missing icon abbreviation for ${iconAbbreviation} (${element.properties.name})`
            );
            break;
        }

        features.push({
          ...element,
          properties: { ...element.properties, description, icon },
        });
      } else {
        features.push(element);
      }
    }
  }

  const jsonToWrite = {
    type: "FeatureCollection",
    features,
  };

  fs.writeFileSync("./src/moments.json", JSON.stringify(jsonToWrite, null, 2));
};

const prepareKml = () => {
  const kml = new DOMParser().parseFromString(
    fs.readFileSync("FullStreamAheadTravels.kml", "utf8")
  );

  const geoJson = toGeoJSON.kml(kml);

  console.log(geoJson);

  writeLineString(geoJson);
  writeDestinations(geoJson);
  writeMoments(geoJson);

  fs.writeFileSync("./src/raw.json", JSON.stringify(geoJson, null, 2));
};

prepareKml();
