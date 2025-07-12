// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SollyCoin.sol";
import "./SollyNFT.sol";

/**
 * @title GameFactory
 * @dev Factory contract voor het beheren van game instances en multiplayer functionaliteit
 */
contract GameFactory is Ownable, Pausable, ReentrancyGuard {
    
    // Events
    event GameInstanceCreated(uint256 indexed gameId, address indexed creator, uint256 entryFee);
    event PlayerJoinedGame(uint256 indexed gameId, address indexed player);
    event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 reward);
    event GameCancelled(uint256 indexed gameId, address indexed creator);
    
    // Game instance struct
    struct GameInstance {
        uint256 gameId;
        address creator;
        uint256 entryFee;
        uint256 maxPlayers;
        uint256 currentPlayers;
        uint256 totalPrizePool;
        uint256 startTime;
        uint256 endTime;
        GameStatus status;
        address[] players;
        mapping(address => bool) hasJoined;
        mapping(address => uint256) playerScores;
    }
    
    enum GameStatus { PENDING, ACTIVE, COMPLETED, CANCELLED }
    
    // Contract references
    SollyCoin public sollyCoin;
    SollyNFT public sollyNFT;
    
    // Game management
    uint256 public gameCounter = 0;
    mapping(uint256 => GameInstance) public games;
    mapping(address => uint256[]) public playerGames;
    
    // Game settings
    uint256 public constant MIN_ENTRY_FEE = 0.001 ether;
    uint256 public constant MAX_ENTRY_FEE = 1 ether;
    uint256 public constant MIN_PLAYERS = 2;
    uint256 public constant MAX_PLAYERS = 10;
    uint256 public constant GAME_DURATION = 1 hours;
    
    // Platform fee (2%)
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 200; // 2% (basis points)
    
    constructor(address initialOwner, address _sollyCoin, address _sollyNFT) Ownable(initialOwner) {
        sollyCoin = SollyCoin(_sollyCoin);
        sollyNFT = SollyNFT(_sollyNFT);
    }
    
    /**
     * @dev Create een nieuwe game instance
     */
    function createGame(uint256 _entryFee, uint256 _maxPlayers) external payable whenNotPaused nonReentrant returns (uint256) {
        require(_entryFee >= MIN_ENTRY_FEE && _entryFee <= MAX_ENTRY_FEE, "Invalid entry fee");
        require(_maxPlayers >= MIN_PLAYERS && _maxPlayers <= MAX_PLAYERS, "Invalid player count");
        require(msg.value == _entryFee, "Entry fee mismatch");
        
        gameCounter++;
        
        GameInstance storage newGame = games[gameCounter];
        newGame.gameId = gameCounter;
        newGame.creator = msg.sender;
        newGame.entryFee = _entryFee;
        newGame.maxPlayers = _maxPlayers;
        newGame.currentPlayers = 1;
        newGame.totalPrizePool = _entryFee;
        newGame.startTime = block.timestamp;
        newGame.endTime = block.timestamp + GAME_DURATION;
        newGame.status = GameStatus.PENDING;
        
        newGame.players.push(msg.sender);
        newGame.hasJoined[msg.sender] = true;
        newGame.playerScores[msg.sender] = 0;
        
        playerGames[msg.sender].push(gameCounter);
        
        emit GameInstanceCreated(gameCounter, msg.sender, _entryFee);
        
        return gameCounter;
    }
    
    /**
     * @dev Join een game instance
     */
    function joinGame(uint256 _gameId) external payable whenNotPaused nonReentrant {
        GameInstance storage game = games[_gameId];
        require(game.status == GameStatus.PENDING, "Game not available");
        require(!game.hasJoined[msg.sender], "Already joined");
        require(game.currentPlayers < game.maxPlayers, "Game full");
        require(msg.value == game.entryFee, "Entry fee mismatch");
        
        game.players.push(msg.sender);
        game.hasJoined[msg.sender] = true;
        game.playerScores[msg.sender] = 0;
        game.currentPlayers++;
        game.totalPrizePool += game.entryFee;
        
        playerGames[msg.sender].push(_gameId);
        
        emit PlayerJoinedGame(_gameId, msg.sender);
        
        // Start game als vol
        if (game.currentPlayers >= game.maxPlayers) {
            game.status = GameStatus.ACTIVE;
        }
    }
    
    /**
     * @dev Submit game score
     */
    function submitScore(uint256 _gameId, uint256 _score) external whenNotPaused {
        GameInstance storage game = games[_gameId];
        require(game.status == GameStatus.ACTIVE, "Game not active");
        require(game.hasJoined[msg.sender], "Not in game");
        require(_score > 0, "Invalid score");
        
        game.playerScores[msg.sender] = _score;
    }
    
    /**
     * @dev Complete game en distribute rewards
     */
    function completeGame(uint256 _gameId) external whenNotPaused nonReentrant {
        GameInstance storage game = games[_gameId];
        require(game.status == GameStatus.ACTIVE, "Game not active");
        require(block.timestamp >= game.endTime, "Game not finished");
        require(msg.sender == game.creator, "Only creator can complete");
        
        game.status = GameStatus.COMPLETED;
        
        // Find winner
        address winner = address(0);
        uint256 highestScore = 0;
        
        for (uint256 i = 0; i < game.players.length; i++) {
            address player = game.players[i];
            uint256 score = game.playerScores[player];
            if (score > highestScore) {
                highestScore = score;
                winner = player;
            }
        }
        
        require(winner != address(0), "No valid scores");
        
        // Calculate rewards
        uint256 platformFee = (game.totalPrizePool * PLATFORM_FEE_PERCENTAGE) / 10000;
        uint256 winnerReward = game.totalPrizePool - platformFee;
        
        // Distribute rewards
        (bool success1, ) = payable(winner).call{value: winnerReward}("");
        require(success1, "Winner reward transfer failed");
        
        (bool success2, ) = payable(owner()).call{value: platformFee}("");
        require(success2, "Platform fee transfer failed");
        
        // Mint SollyCoins voor de winner
        sollyCoin.mintSolly(1, "Game winner reward");
        
        emit GameCompleted(_gameId, winner, winnerReward);
    }
    
    /**
     * @dev Cancel game (alleen creator)
     */
    function cancelGame(uint256 _gameId) external whenNotPaused nonReentrant {
        GameInstance storage game = games[_gameId];
        require(game.status == GameStatus.PENDING, "Game cannot be cancelled");
        require(msg.sender == game.creator, "Only creator can cancel");
        
        game.status = GameStatus.CANCELLED;
        
        // Refund alle spelers
        for (uint256 i = 0; i < game.players.length; i++) {
            address player = game.players[i];
            (bool success, ) = payable(player).call{value: game.entryFee}("");
            require(success, "Refund failed");
        }
        
        emit GameCancelled(_gameId, msg.sender);
    }
    
    /**
     * @dev Get game details
     */
    function getGame(uint256 _gameId) external view returns (
        uint256 gameId,
        address creator,
        uint256 entryFee,
        uint256 maxPlayers,
        uint256 currentPlayers,
        uint256 totalPrizePool,
        uint256 startTime,
        uint256 endTime,
        GameStatus status,
        address[] memory players
    ) {
        GameInstance storage game = games[_gameId];
        return (
            game.gameId,
            game.creator,
            game.entryFee,
            game.maxPlayers,
            game.currentPlayers,
            game.totalPrizePool,
            game.startTime,
            game.endTime,
            game.status,
            game.players
        );
    }
    
    /**
     * @dev Get player score in game
     */
    function getPlayerScore(uint256 _gameId, address _player) external view returns (uint256) {
        return games[_gameId].playerScores[_player];
    }
    
    /**
     * @dev Get player's games
     */
    function getPlayerGames(address _player) external view returns (uint256[] memory) {
        return playerGames[_player];
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