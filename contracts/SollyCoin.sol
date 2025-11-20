// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SollyCoin
 * @dev ERC-20 token voor het SollyCoin universum met game-specifieke functionaliteit
 */
contract SollyCoin is ERC20, Ownable, Pausable, ReentrancyGuard {
    
    // Game-specifieke events
    event GameProgressUpdated(address indexed player, uint256 level, uint256 score);
    event SollyMinted(address indexed player, uint256 tokenId, uint256 level);
    event GameRewardClaimed(address indexed player, uint256 amount, string reason);
    
    // Game state mapping
    mapping(address => GameState) public playerGameState;
    mapping(uint256 => SollyToken) public sollyTokens;
    
    // Game constants
    uint256 public constant REWARD_PER_LEVEL = 100 * 10**18; // 100 SollyCoins per level
    uint256 public constant MAX_LEVEL = 100;
    uint256 public sollyTokenCounter = 0;
    
    struct GameState {
        uint256 level;
        uint256 score;
        uint256 lastPlayed;
        bool isActive;
    }
    
    struct SollyToken {
        uint256 tokenId;
        address owner;
        uint256 level;
        string metadata;
        uint256 createdAt;
        bool isActive;
    }
    
    constructor(address initialOwner) ERC20("SollyCoin", "SOLLY") Ownable(initialOwner) {
        _mint(initialOwner, 1000000 * 10**18); // 1 miljoen SollyCoins voor initial distribution
    }
    
    /**
     * @dev Update game progress voor een speler
     */
    function updateGameProgress(uint256 _level, uint256 _score) external whenNotPaused {
        require(_level <= MAX_LEVEL, "Level exceeds maximum");
        require(_score > 0, "Score must be positive");
        
        GameState storage state = playerGameState[msg.sender];
        state.level = _level;
        state.score = _score;
        state.lastPlayed = block.timestamp;
        state.isActive = true;
        
        emit GameProgressUpdated(msg.sender, _level, _score);
    }
    
    /**
     * @dev Mint een nieuwe Solly token voor de speler
     */
    function mintSolly(uint256 _level, string memory _metadata) external whenNotPaused nonReentrant {
        require(_level <= MAX_LEVEL, "Level exceeds maximum");
        require(bytes(_metadata).length > 0, "Metadata cannot be empty");
        
        sollyTokenCounter++;
        
        SollyToken memory newSolly = SollyToken({
            tokenId: sollyTokenCounter,
            owner: msg.sender,
            level: _level,
            metadata: _metadata,
            createdAt: block.timestamp,
            isActive: true
        });
        
        sollyTokens[sollyTokenCounter] = newSolly;
        
        // Mint SollyCoins als beloning
        uint256 reward = REWARD_PER_LEVEL * _level;
        _mint(msg.sender, reward);
        
        emit SollyMinted(msg.sender, sollyTokenCounter, _level);
        emit GameRewardClaimed(msg.sender, reward, "Solly minted");
    }
    
    /**
     * @dev Claim beloning voor level completion
     */
    function claimLevelReward(uint256 _level) external whenNotPaused nonReentrant {
        require(_level <= MAX_LEVEL, "Level exceeds maximum");
        
        GameState storage state = playerGameState[msg.sender];
        require(state.level >= _level, "Level not reached yet");
        
        uint256 reward = REWARD_PER_LEVEL * _level;
        _mint(msg.sender, reward);
        
        emit GameRewardClaimed(msg.sender, reward, "Level completed");
    }
    
    /**
     * @dev Get game state van een speler
     */
    function getGameState(address _player) external view returns (GameState memory) {
        return playerGameState[_player];
    }
    
    /**
     * @dev Get Solly token details
     */
    function getSollyToken(uint256 _tokenId) external view returns (SollyToken memory) {
        require(sollyTokens[_tokenId].isActive, "Token does not exist");
        return sollyTokens[_tokenId];
    }
    
    /**
     * @dev Unlock chapter met SollyCoins (burn coins)
     */
    function unlockChapter(uint256 _chapter, uint256 _price) external whenNotPaused nonReentrant {
        require(_chapter > 0, "Invalid chapter");
        require(_price > 0, "Invalid price");
        require(balanceOf(msg.sender) >= _price * 10**18, "Insufficient SollyCoin balance");
        
        _burn(msg.sender, _price * 10**18);
        
        GameState storage state = playerGameState[msg.sender];
        if (_chapter > state.level / 10) {
            state.level = _chapter * 10;
        }
        
        emit GameRewardClaimed(msg.sender, _price * 10**18, "Chapter unlocked");
    }
    
    /**
     * @dev Buy progress within chapter (skip level)
     */
    function buyProgress(uint256 _levelsToSkip, uint256 _pricePerLevel) external whenNotPaused nonReentrant {
        require(_levelsToSkip > 0, "Invalid levels");
        require(_pricePerLevel > 0, "Invalid price");
        
        uint256 totalCost = _levelsToSkip * _pricePerLevel * 10**18;
        require(balanceOf(msg.sender) >= totalCost, "Insufficient SollyCoin balance");
        
        _burn(msg.sender, totalCost);
        
        GameState storage state = playerGameState[msg.sender];
        state.level += _levelsToSkip;
        
        emit GameRewardClaimed(msg.sender, totalCost, "Progress purchased");
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
} 