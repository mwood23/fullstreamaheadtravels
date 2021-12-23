import { FC, useEffect, useMemo, useState } from "react";
import "./App.css";
import ReactMapGL, {
  InteractiveMapProps,
  Layer,
  Marker,
  Source,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import lineStringJsonImport from "./line-string.json";
import destinationsJson from "./destinations.json";
import momentsJson from "./moments.json";
import travelBuddies from "./travel-buddies.png";
import useMeasure from "react-use/esm/useMeasure";
import useInterval from "react-use/esm/useInterval";
import useThrottleFn from "react-use/esm/useThrottleFn";
import useMedia from "react-use/esm/useMedia";
import { useSpring, a } from "@react-spring/web";
import {
  SPEED_COEFFICIENT,
  INITIAL_START_POINT,
  TILE_FLIP_DELAY,
  FLIP_NUMBER,
  TOTAL_CARDS,
  TOTAL_PHOTOS,
} from "./config";
import { getDistance } from "geolib";
import { uniqBy } from "lodash";

const lineStringJson = lineStringJsonImport as any;

const destinations = {
  type: "FeatureCollection",
  features: destinationsJson.features.map((f, i) => ({
    ...f,
    properties: {
      ...f.properties,
      stopNumber: i + 1,
    },
  })),
};

const totalNumberOfCoordinatesOnPath =
  lineStringJson.features[0].geometry.coordinates.length;

const getRandomPhoto = () => {
  const photoNumber = randomIntFromInterval(0, TOTAL_PHOTOS)
    .toString()
    .padStart(4, "0");

  return `https://res.cloudinary.com/friendzone/image/upload/c_fill,h_400,q_auto:good,w_700/fullstreamahead/${photoNumber}.jpg`;
};

const buildCards = () => {
  const cards = [];
  for (let index = 0; index < TOTAL_CARDS; index++) {
    cards.push({
      index,
      flipped: false,
      imageFront: getRandomPhoto(),
      imageBack: getRandomPhoto(),
    });
  }

  return cards;
};

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const Map: FC<{ width: number; height: number }> = ({ width, height }) => {
  const [activeDestinations, setActiveDestinations] = useState<any[]>([]);
  const [viewport, setViewport] = useState<InteractiveMapProps>({
    longitude: -95.7129,
    latitude: 37.0902,
    zoom: 5,
    mapboxApiAccessToken:
      "pk.eyJ1IjoibWFyY3Vzd29vZDIzIiwiYSI6ImNqNWVqdzZzOTA1MzAzM21uejB1OHd6NGIifQ.B3sfFWNRf4mRXKcIAsxwFA",
    mapOptions: {
      style: "mapbox://styles/marcuswood23/ckx8ekzvx9jmg16ulipafkt2x",
    },
    // transitionInterpolator: new FlyToInterpolator(),
  });
  const [airstreamIndex, setAirstreamIndex] = useState(INITIAL_START_POINT);

  useEffect(() => {
    setTimeout(() => {
      setViewport((x) => ({ ...x, width, height }));
    }, 200);
  }, [width, height]);

  useEffect(() => {
    function animate() {
      setAirstreamIndex((i) => {
        const newIndex = i + SPEED_COEFFICIENT;
        if (newIndex >= totalNumberOfCoordinatesOnPath) {
          return 0;
        }

        return newIndex;
      });

      // Request the next frame of animation as long as the end has not been reached
      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  // useThrottleFn<void, number[]>(
  //   (cachedIndex) => {
  //     setActiveDestinations((prev) => {
  //       const newDestinations = FEATURES.filter((feature: any) => {
  //         return (
  //           getDistance(
  //             [
  //               feature.geometry.coordinates[0],
  //               feature.geometry.coordinates[1],
  //             ],
  //             [
  //               lineStringJson.features[0].geometry.coordinates[cachedIndex][0],
  //               lineStringJson.features[0].geometry.coordinates[cachedIndex][1],
  //             ]
  //           ) < 20000 // 5 miles
  //         );
  //       });

  //       // Uniqby takes the first it finds so we make the array backwards and then reverse it so indexes will work
  //       return uniqBy(
  //         [...newDestinations, ...prev],
  //         (x: any) => x.properties.name
  //       ).reverse();
  //     });
  //   },
  //   200,
  //   [airstreamIndex]
  // );

  // useThrottleFn<void, number[]>(
  //   (cachedIndex) => {
  //     setViewport((prev) => ({
  //       ...prev,
  //       longitude:
  //         lineStringJson.features[0].geometry.coordinates[cachedIndex][0],
  //       latitude:
  //         lineStringJson.features[0].geometry.coordinates[cachedIndex][1],
  //     }));
  //   },
  //   400,
  //   [airstreamIndex]
  // );

  const lineLayer = useMemo(
    () => (
      // @ts-ignore
      <Source id="lineLayer" type="geojson" data={lineStringJson}>
        <Layer
          id="lineLayer"
          type="line"
          source="my-data"
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
          paint={{
            "line-color": "rgba(3, 170, 238, 0.5)",
            "line-width": 5,
          }}
        />
      </Source>
    ),
    []
  );
  const locationsLayer = useMemo(
    () => (
      // @ts-ignore
      <Source id="locationsLayer" type="geojson" data={destinations}>
        <Layer
          id="locations-layer"
          type="symbol"
          layout={{
            // "icon-image": "bus-15",
            "text-field": ["get", "stopNumber"],
            // "text-offset": [0, 1.25],
          }}
          paint={{
            "text-color": "#000000",
          }}
        />
      </Source>
    ),
    []
  );
  const momentsLayer = useMemo(
    () => (
      // @ts-ignore
      <Source id="momentsLayer" type="geojson" data={momentsJson}>
        <Layer
          id="moments-layer"
          type="symbol"
          layout={{
            // "icon-image": "bus-15",
            "text-field": [
              "format",
              ["get", "name"],
              { "font-scale": 0.8 },
              "\n",
              {},
              ["get", "description"],
              {
                "font-scale": 0.6,
                "text-font": [
                  "literal",
                  ["DIN Offc Pro Italic", "Arial Unicode MS Regular"],
                ],
              },
            ],
            // "text-offset": [0, 1.25],
          }}
          paint={{
            "text-color": "#000000",
          }}
        />
      </Source>
    ),
    []
  );

  // // Only rerender markers if props.data has changed
  // const destinations = useMemo(
  //   () =>
  //     activeDestinations.map((feature, i) => (
  //       <Marker
  //         key={`${feature.properties.name}-${feature.properties.styleHash}`}
  //         longitude={feature.geometry.coordinates[0]}
  //         latitude={feature.geometry.coordinates[1]}
  //         offsetLeft={-12.5}
  //         offsetTop={-12.5}
  //       >
  //         <div
  //           style={{
  //             width: "25px",
  //             fontSize: "12px",
  //             borderRadius: "50%",
  //             // border: "5px solid",
  //             // borderColor: "black",
  //             color: "black",
  //             fontWeight: "bold",
  //             height: "25px",
  //             lineHeight: "25px",
  //             verticalAlign: "middle",
  //           }}
  //         >
  //           {feature.properties.name}
  //         </div>
  //       </Marker>
  //     )),
  //   [activeDestinations]
  // );

  // const transitions = useTransition(activeDestinations, {
  //   from: { opacity: 0, transform: `scale(0)` },
  //   enter: { opacity: 1, transform: `scale(1)` },
  //   leave: { opacity: 0, transform: `scale(0)` },
  //   delay: 200,
  //   config: config.wobbly,
  // });

  return (
    <ReactMapGL {...viewport} onViewportChange={setViewport}>
      {lineLayer}
      {locationsLayer}
      {momentsLayer}
      {/* {transitions((style, feature) => (
        <Marker
          longitude={feature.geometry.coordinates[0]}
          latitude={feature.geometry.coordinates[1]}
          offsetTop={-12.5}
        >
          <a.div
            style={{
              ...style,
              backgroundColor: "white",
              borderRadius: "5px",
              fontWeight: "bold",
              padding: "5px",
              fontSize: "12px",
              zIndex: feature.properties.stopNumber,
            }}
          >
            {feature.properties.stopNumber}
          </a.div>
        </Marker>
      ))} */}

      <Marker
        longitude={
          lineStringJson.features[0].geometry.coordinates[airstreamIndex][0]
        }
        latitude={
          lineStringJson.features[0].geometry.coordinates[airstreamIndex][1]
        }
        offsetLeft={-40}
        offsetTop={-22}
      >
        {/* <div
        style={{
          width: "25px",
          borderRadius: "50%",
          border: "5px solid",
          borderColor: "black",
          color: "black",
          fontWeight: "bold",
          height: "25px",
          lineHeight: "25px",
          verticalAlign: "middle",
        }}
      >
        X
      </div> */}
        <img
          src={travelBuddies}
          style={{ objectFit: "contain" }}
          width="80px"
        />
      </Marker>
    </ReactMapGL>
  );
};

const Card: FC<{ imageFront: string; imageBack: string; flipped: boolean }> = ({
  imageFront,
  imageBack,
  flipped,
}) => {
  const { transform, opacity } = useSpring({
    opacity: flipped ? 1 : 0,
    transform: `perspective(600px) rotateY(${flipped ? -180 : 0}deg)`,
    config: { mass: 5, tension: 500, friction: 80 },
  });
  return (
    <div className={"card"}>
      <a.div
        className={`card--front`}
        style={{
          opacity: opacity.to((o) => 1 - o),
          transform,
          backgroundImage: `url(${imageFront})`,
        }}
      />
      <a.div
        className={`card--back`}
        style={{
          opacity,
          transform,
          rotateY: "180deg",
          backgroundImage: `url(${imageBack})`,
        }}
      />
    </div>
  );
};

function App() {
  const [ref, { width, height }] = useMeasure();
  const [cards, setCards] = useState(buildCards());
  const isMobile = useMedia("(max-width: 1200px)");

  useInterval(() => {
    const indexesToChange = new Set<number>();

    if (isMobile) {
      indexesToChange.add(0);
    } else {
      for (let index = 0; index < FLIP_NUMBER; index++) {
        indexesToChange.add(randomIntFromInterval(0, TOTAL_CARDS - 1));
      }
    }

    setCards((oldCards) => {
      const newCards = [...oldCards];
      indexesToChange.forEach((i) => {
        const cardToToggle = newCards[i];
        newCards[i] = {
          ...cardToToggle,
          flipped: !cardToToggle.flipped,
          // TODO: Choose random image
          imageFront:
            cardToToggle.flipped === true ? getRandomPhoto() : getRandomPhoto(),
          imageBack:
            cardToToggle.flipped === false
              ? getRandomPhoto()
              : getRandomPhoto(),
        };
      });

      return newCards;
    });
  }, TILE_FLIP_DELAY);

  return (
    <div className="App">
      {cards.map((card) => {
        return (
          <Card
            key={card.index}
            imageFront={card.imageFront}
            imageBack={card.imageBack}
            flipped={card.flipped}
          />
        );
      })}
      {/* 
      // @ts-ignore */}
      <div className="card--main" ref={ref}>
        {width > 0 && height > 0 ? <Map width={width} height={height} /> : null}
      </div>
    </div>
  );
}

export default App;
