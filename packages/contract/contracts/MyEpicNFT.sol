// MyEpicNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC2981.sol";
// import "hardhat/console.sol";

import { Base64 } from "./libraries/Base64.sol";

contract MyEpicNFT is ERC721URIStorage, IERC2981, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint256 private MAX_NFT_SUPPLY = 50;  // MAX_NFT_SUPPLY was originally a constant, but was made changeable for flexibility.
    uint256 public mintingFee = 10**13;  // 0.00001 ether

    string baseSvg = "<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 350 350'><style>.base { fill: white; font-family: serif; font-size: 24px; }</style><rect width='100%' height='100%' fill='black' /><text x='50%' y='50%' class='base' dominant-baseline='middle' text-anchor='middle'>";
    string[] firstWords = ["Shoot", "Task", "Couple", "Senior", "Attack", "Bed", "Assume", "News", "Drive", "Quality"];
    string[] secondWords = ["Behind", "Body", "Front", "Year", "Three", "Everything", "Head", "Middle", "Happy", "Everything"];
    string[] thirdWords = ["Push", "Break", "Ten", "Begin", "Until", "Even", "Board", "Order", "Lead", "Moment"];

    address public royaltyReceiver;
    uint256 public royaltyPercentage = 10;  // 10%

    event NewEpicNFTMinted(address sender, uint256 tokenId);

    constructor() ERC721("SquareNFT", "SQUARE") {
        royaltyReceiver = payable(owner());
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    function maxSupply() public view returns (uint256) {
        return MAX_NFT_SUPPLY;
    }

    function setMaxSupply(uint256 value) public onlyOwner {
        MAX_NFT_SUPPLY = value;
    }

    function setMintingFee(uint256 newFee) public onlyOwner {
        mintingFee = newFee;
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function random(string memory input) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(input)));
    }

    function pickRandomFirstWord(uint256 tokenId) public view returns (string memory) {
        uint256 rand = random(string(abi.encodePacked("FIRST_WORD", Strings.toString(tokenId))));
        rand = rand % firstWords.length;
        return firstWords[rand];
    }

    function pickRandomSecondWord(uint256 tokenId) public view returns (string memory) {
        uint256 rand = random(string(abi.encodePacked("SECOND_WORD", Strings.toString(tokenId))));
        rand = rand % secondWords.length;
        return secondWords[rand];
    }

    function pickRandomThirdWord(uint256 tokenId) public view returns (string memory) {
        uint256 rand = random(string(abi.encodePacked("THIRD_WORD", Strings.toString(tokenId))));
        rand = rand % thirdWords.length;
        return thirdWords[rand];
    }

    function makeAnEpicNFT() public payable {
        require(totalSupply() < maxSupply(), "Maximum NFT supply reached.");

        if (msg.sender != owner()) {
            require(msg.value >= mintingFee, "Insufficient minting fee provided");
        }

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        string memory first = pickRandomFirstWord(newItemId);
        string memory second = pickRandomSecondWord(newItemId);
        string memory third = pickRandomThirdWord(newItemId);
        string memory combinedWord = string(abi.encodePacked(first, second, third));
        string memory finalSvg = string(abi.encodePacked(baseSvg, combinedWord, "</text></svg>"));

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        combinedWord,
                        '", "description": "A highly acclaimed collection of squares.", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(finalSvg)),
                        '"}'
                    )
                )
            )
        );
        string memory finalTokenUri = string(abi.encodePacked("data:application/json;base64,", json));

        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, finalTokenUri);

        emit NewEpicNFTMinted(msg.sender, newItemId);
    }

    function setRoyaltyReceiver(address payable _newReceiver) external onlyOwner {
        require(_newReceiver != address(0), "Invalid address");
        royaltyReceiver = _newReceiver;
    }

    function setRoyaltyPercentage(uint256 newRoyaltyPercentage) public onlyOwner {
        royaltyPercentage = newRoyaltyPercentage;
    }

    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        return (royaltyReceiver, salePrice * royaltyPercentage / 100);
    }
}
