// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SollyCoin is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    constructor() ERC721("SollyCoin", "SOLLY") Ownable(msg.sender) {}

    // Mint een nieuwe SollyCoin NFT met metadata-URL (bijv. IPFS)
    function mintSollyCoin(address to, string memory tokenURI) public returns (uint256) {
        uint256 tokenId = nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        nextTokenId++;
        return tokenId;
    }

    // Alleen de eigenaar mag de metadata updaten (optioneel)
    function updateTokenURI(uint256 tokenId, string memory newTokenURI) public onlyOwner {
        _setTokenURI(tokenId, newTokenURI);
    }
} 