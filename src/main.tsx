import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { TOTAL_PHOTOS } from "./config";

const getPhotoName = (number: number) => {
  return number.toString().padStart(4, "0");
};

function imageLoaded(imageNumber: number, alt = ""): Promise<HTMLImageElement> {
  const photoName = getPhotoName(imageNumber);
  return new Promise(function (resolve) {
    const image = document.createElement("img");
    image.setAttribute("alt", alt);
    image.setAttribute(
      "src",
      `https://res.cloudinary.com/friendzone/image/upload/c_fill,h_400,q_auto:good,w_700/fullstreamahead/${photoName}.jpg`
    );
    image.setAttribute("id", photoName);
    image.style.display = "none";

    image.addEventListener("load", function () {
      resolve(image);
    });
  });
}

const prepare = async () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("preload") !== "true") return;

  const imagePromises = [];

  for (let index = 0; index <= TOTAL_PHOTOS; index++) {
    imagePromises.push(imageLoaded(index));
  }

  const results = await Promise.all(imagePromises);

  results.forEach((r) => {
    document.body.appendChild(r);
  });

  console.log("All images preloaded");
};

prepare().then(() => {
  return ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById("root")
  );
});
