import { useState } from "react";
import { create } from "ipfs-http-client";
import axios from "axios";
import { BigNumber, ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import { ABI } from "./abi";
const contractAddress = "0xa0Afb3513B99E1b099CE9F3C007eE937B04e7870";
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
  const [authHeader, setAuthHeader] = useState();
  const [file, setFile] = useState();
  const [imageCid, setImageCid] = useState();
  const [name, setName] = useState();
  const [desc, setDesc] = useState();
  const [metadataCid, setMetadataCid] = useState();
  const [tokenId, setTokenId] = useState();
  const [txHash, setTxHash] = useState();
  const [selectedGw, setSelectedGw] = useState("https://gw-nft.crustapps.net");
  const [message, setMessage] = useState("");

  const getSignatureHandle = async () => {
    const provider = await detectEthereumProvider();
    if (provider && provider.isMetaMask) {
      const chainId = await provider.request({
        method: "eth_chainId",
      });

      if (true) {
        await provider.request({ method: "eth_requestAccounts" });
        const providerPolygon = new ethers.providers.Web3Provider(provider);
        const signer = providerPolygon.getSigner();
        const addr = await signer.getAddress();
        const signature = await signer.signMessage(addr);
        setAuthHeader(
          Buffer.from(`pol-${addr}:${signature}`).toString("base64")
        );
      }
    }
  };

  const uploadImageHandle = async () => {
    console.log("Create ipfs client");
    setMessage("Creating IPFS client");
    const ipfs = create({
      url: selectedGw + "/api/v0",
      headers: {
        authorization: "Basic " + authHeader,
      },
    });

    console.log("Upload file");
    setMessage("Waiting: Uploading file");
    const added = await ipfs.add(file);

    console.log("Uploaded file");
    setMessage("Uploaded file");
    pinW3Crust(authHeader, added.path, "image");
    setImageCid(added.path);
  };

  const uploadMetadataHandle = async () => {
    const ipfs = create({
      url: selectedGw + "/api/v0",
      headers: {
        authorization: "Basic " + authHeader,
      },
    });

    const metadata = {
      name: name,
      description: desc,
      image: `ipfs://${imageCid}`,
    };

    const added = await ipfs.add(JSON.stringify(metadata));
    pinW3Crust(authHeader, added.path, "metadata");
    setMetadataCid(added.path);
  };

  async function mintNTF() {
    const provider = await detectEthereumProvider();
    if (provider && provider.isMetaMask) {
      const chainId = await provider.request({
        method: "eth_chainId",
      });

      if (parseInt(chainId, 16) === 137) {
        const providerPolygon = new ethers.providers.Web3Provider(provider);
        const signer = providerPolygon.getSigner();
        const addr = await signer.getAddress();
        const contract = new ethers.Contract(
          contractAddress,
          ABI,
          providerPolygon
        );
        const signedContract = contract.connect(signer);

        signedContract
          .mintDataNTF(
            addr,
            `ipfs://${metadataCid}`,
            `ipfs://${imageCid}`,
            "null",
            { gasPrice: BigNumber.from("36000000000") }
          )
          .then((tx) => {
            setTxHash(tx.hash);
            providerPolygon.waitForTransaction(tx.hash).then(() => {
              providerPolygon.getTransactionReceipt(tx.hash).then((receipt) => {
                setTokenId(parseInt(receipt.logs[0].topics[3], 16));
              });
            });
          })
          .catch((error) => {});
      }
    }
  }

  return (
    <div style={{ paddingLeft: "50px" }}>
      <label>Select a gateway:</label>
      <select
        value={selectedGw}
        onChange={(e) => {
          setSelectedGw(e.target.value);
        }}
      >
        <option value="https://gw-nft.crustapps.net">
          https://gw-nft.crustapps.net
        </option>
        <option value="https://gw.crustapps.net">
          https://gw.crustapps.net
        </option>
        <option value="https://crustwebsites.net">
          https://crustwebsites.net
        </option>
        <option value="https://crustipfs.xyz">https://crustipfs.xyz</option>
      </select>
      <div>Selected gateway url: {selectedGw}</div>
      <h1>1. Get Signature</h1>
      <button onClick={getSignatureHandle}>Get Signature</button>
      <div>{authHeader}</div>

      <h1>2. Upload Image</h1>
      <input
        type="file"
        onChange={(e) => {
          setFile(e.target.files[0]);
        }}
      />
      <br />
      <button onClick={uploadImageHandle}>Upload</button>
      <br />
      <br />
      {message && <>Message: {message}</>}
      <br />
      {imageCid && (
        <a
          href={`https://${selectedGw}/ipfs/${imageCid}`}
          target="_blank"
          rel="noreferrer"
        >
          File Link
        </a>
      )}
      {/*
      <h1>3. Upload Metadata</h1>
      <div>Name</div>
      <input
        onChange={(e) => {
          setName(e.target.value);
        }}
      />
      <div>Description</div>
      <input
        onChange={(e) => {
          setDesc(e.target.value);
        }}
      />
      <br />
      <button onClick={uploadMetadataHandle}>Upload</button>
      <br />
      {metadataCid && (
        <a
          href={`https://gw.crustapps.net/ipfs/${metadataCid}`}
          target="_blank"
          rel="noreferrer"
        >
          Metadata Link
        </a>
      )}

      <h1>4. Mint NFT</h1>
      <button onClick={mintNTF}>Mint NFT</button>
      <br />
      {txHash && (
        <a
          href={`https://polygonscan.com/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          Transaction Hash
        </a>
      )}
      <br />
      {tokenId && (
        <a
          href={`https://switchswap.io/#/assets/polygon/${contractAddress}/${tokenId}`}
          target="_blank"
          rel="noreferrer"
        >
          NFT on SwitchSwap
        </a>
      )}
      <br />
      {tokenId && (
        <a
          href={`https://opensea.io/assets/matic/${contractAddress}/${tokenId}`}
          target="_blank"
          rel="noreferrer"
        >
          NFT on OpenSea
        </a>
      )} */}
    </div>
  );
}

export default App;
