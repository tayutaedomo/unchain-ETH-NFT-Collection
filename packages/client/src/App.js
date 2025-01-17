import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import useMintCounts from "./hooks/useMintCounts";

import twitterLogo from "./assets/twitter-logo.svg";
import "./styles/App.css";
import myEpicNft from "./utils/MyEpicNFT.json";

const TWITTER_HANDLE = process.env.REACT_APP_TWITTER_HANDLE;
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const CONTRACT_ADDRESS = process.env.REACT_APP_MY_EPIC_NFT_ADDRESS;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const { currentMintCount, maxMintCount, fetchAndUpdateMintCount } =
    useMintCounts();
  const [isMinting, setIsMinting] = useState(false);

  const setEventListener = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          fetchAndUpdateMintCount();

          const message = `あなたのウォレットに NFT を送信しました。gemcase に表示されるまで数分かかることがあります。NFT へのリンクはこちらです: https://gemcase.vercel.app/view/evm/sepolia/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`;
          console.log(from, tokenId.toNumber(), message);
          alert(message);
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
      setEventListener();

      checkAndAlertIfWrongNetwork();
    } else {
      console.log("No authorized account found");
    }
  };

  const checkAndAlertIfWrongNetwork = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const chainId = await ethereum.request({ method: "eth_chainId" });
        const sepoliaChainId = "0xaa36a7";
        if (chainId !== sepoliaChainId) {
          alert("You are not connected to the Sepolia Test Network!");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      setEventListener();

      checkAndAlertIfWrongNetwork();
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
    try {
      setIsMinting(true);

      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        console.log("Going to pop wallet now to pay gas...");

        const nftTxn = await connectedContract.makeAnEpicNFT();
        console.log("Mining...please wait.");
        await nftTxn.wait();
        setIsMinting(false);
        console.log(
          `Mined, see transaction: https://sepolia.etherscan.io/tx/${nftTxn.hash}`
        );
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setIsMinting(false);
      console.log(error);
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );
  const renderMintUI = () => (
    <button
      onClick={askContractToMintNft}
      className="cta-button mint-button"
      disabled={isMinting}
    >
      {isMinting ? "Loading..." : "Mint NFT"}
    </button>
  );

  useEffect(() => {
    checkIfWalletIsConnected();
    fetchAndUpdateMintCount();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            あなただけの特別な NFT を Mint しよう💫
            <br />
            <span className="mint-count">
              これまでに作成された {currentMintCount} / {maxMintCount} NFT
            </span>
            <br />
            <a
              href={`https://gemcase.vercel.app/view/evm/sepolia/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
            >
              <button className="cta-button opensea-button">
                gemcase で NFT を見る
              </button>
            </a>
          </p>
          {currentAccount === ""
            ? renderNotConnectedContainer()
            : renderMintUI()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
