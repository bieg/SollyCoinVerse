// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SollyNFT
 * @dev NFT contract voor Solly collectibles met game integratie
 */
contract SollyNFT is ERC721, ERC721URIStorage, Ownable, Pausable {
    uint256 private _tokenIds;
    
    // Events
    event SollyNFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event SollyNFTUpdated(uint256 indexed tokenId, string newTokenURI);
    
    // NFT metadata struct
    struct SollyMetadata {
        uint256 level;
        string shape;
        uint256 size;
        uint256 kaboom;
        uint256 createdAt;
        bool isSpecial;
    }
    
    // Mapping van tokenId naar metadata
    mapping(uint256 => SollyMetadata) public sollyMetadata;
    
    // Minting limits
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MINT_PRICE = 0.01 ether;
    
    constructor(address initialOwner) ERC721("SollyNFT", "SOLLY") Ownable(initialOwner) {}
    
    /**
     * @dev Mint een nieuwe Solly NFT
     */
    function mintSollyNFT(
        address to,
        string memory _tokenURI,
        uint256 level,
        string memory shape,
        uint256 size,
        uint256 kaboom,
        bool isSpecial
    ) external payable whenNotPaused returns (uint256) {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(_tokenIds < MAX_SUPPLY, "Max supply reached");
        require(bytes(_tokenURI).length > 0, "TokenURI cannot be empty");
        
        _tokenIds += 1;
        uint256 newTokenId = _tokenIds;
        
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        
        // Store metadata
        sollyMetadata[newTokenId] = SollyMetadata({
            level: level,
            shape: shape,
            size: size,
            kaboom: kaboom,
            createdAt: block.timestamp,
            isSpecial: isSpecial
        });
        
        emit SollyNFTMinted(to, newTokenId, _tokenURI);
        
        return newTokenId;
    }
    
    /**
     * @dev Update NFT metadata (alleen owner van de NFT)
     */
    function updateSollyMetadata(
        uint256 tokenId,
        string memory newTokenURI,
        uint256 newLevel,
        string memory newShape,
        uint256 newSize,
        uint256 newKaboom
    ) external whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        _setTokenURI(tokenId, newTokenURI);
        
        SollyMetadata storage metadata = sollyMetadata[tokenId];
        metadata.level = newLevel;
        metadata.shape = newShape;
        metadata.size = newSize;
        metadata.kaboom = newKaboom;
        
        emit SollyNFTUpdated(tokenId, newTokenURI);
    }
    
    /**
     * @dev Get Solly metadata
     */
    function getSollyMetadata(uint256 tokenId) external view returns (SollyMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return sollyMetadata[tokenId];
    }
    
    /**
     * @dev Get total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIds;
    }
    
    /**
     * @dev Pause/unpause contract (alleen owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Withdraw contract balance (alleen owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // Override functies
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 