import { useState } from "react";
import { create, urlSource } from "ipfs-http-client";
import axios from "axios";
const ipfsGateway = "https://gw.crustapps.net";
// const ipfsGateway = "https://crustwebsites.net";
// const ipfsGateway = "https://crustipfs.xyz";
const ipfsPinningService = "https://pin.crustcode.com/psa";

export const pinW3Crust = async (authHeader, cid, name) => {
  await axios.post(
    ipfsPinningService + "/pins",
    {
      cid,
      name,
    },
    {
      headers: {
        authorization: "Bearer " + authHeader,
        "Content-Type": "application/json",
      },
    }
  );
};

function App() {
  const [authHeader, setAuthHeader] = useState(
    "cG9sLTB4QTIyOGNGYWI4MEE2NzM4NTIyNDc2RGVDMTFkNzkzZDYxMjk5NjhiMjoweGU2ZDA1NDIzYTcxY2YzNjdjNWNhZmQwNzRmOWZjODAyMWUwMmEzZDA4MGViZTMyY2VhNDA0MjkwZTgxOWM5YTExMDUxMjNhZDJjZWM2ZjQ1Y2NiZWRmOTYyYjc5NzA4YWRiYjMwNTcxMGEzZWIzYjMzOWM3MzFmNTc1NGM4NWY1MWM="
  );

  const uploadImageHandle = async () => {
    console.log("start uploading");
    const ipfs = create({
      url: ipfsGateway + "/api/v0",
      headers: {
        authorization: "Basic " + authHeader,
      },
    });

    const addOptions = {
      pin: true,
      wrapWithDirectory: true,
      timeout: 10000,
    };

    for await (const file of ipfs.addAll(
      [
        urlSource(
          "https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png"
        ),
        urlSource(
          "https://thumbs.dreamstime.com/z/l-alphabet-marque-avec-des-lettres-l-abc-14509171.jpg"
        ),
      ],
      addOptions
    )) {
      console.log(file.cid.toV0().toString());
    }
  };

  return (
    <div style={{ paddingLeft: "50px" }}>
      <h1>1. Upload Images</h1>
      <br />
      <button onClick={uploadImageHandle}>Upload</button>
      <br />
    </div>
  );
}

export default App;
