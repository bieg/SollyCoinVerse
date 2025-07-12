const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SollyCoin dApp Contracts", function () {
  let sollyCoin, sollyNFT, gameFactory;
  let owner, player1, player2, player3;
  let addrs;

  beforeEach(async function () {
    [owner, player1, player2, player3, ...addrs] = await ethers.getSigners();

    // Deploy contracts
    const SollyCoin = await ethers.getContractFactory("SollyCoin");
    sollyCoin = await SollyCoin.deploy(owner.address);

    const SollyNFT = await ethers.getContractFactory("SollyNFT");
    sollyNFT = await SollyNFT.deploy(owner.address);

    const GameFactory = await ethers.getContractFactory("GameFactory");
    gameFactory = await GameFactory.deploy(owner.address, await sollyCoin.getAddress(), await sollyNFT.getAddress());
  });

  describe("SollyCoin ERC-20", function () {
    it("Should have correct name and symbol", async function () {
      expect(await sollyCoin.name()).to.equal("SollyCoin");
      expect(await sollyCoin.symbol()).to.equal("SOLLY");
    });

    it("Should mint initial supply to deployer", async function () {
      const initialSupply = ethers.parseEther("1000000");
      expect(await sollyCoin.balanceOf(owner.address)).to.equal(initialSupply);
    });

    it("Should update game progress", async function () {
      const level = 5;
      const score = 1000;
      
      await sollyCoin.connect(player1).updateGameProgress(level, score);
      
      const gameState = await sollyCoin.getGameState(player1.address);
      expect(gameState.level).to.equal(level);
      expect(gameState.score).to.equal(score);
      expect(gameState.isActive).to.be.true;
    });

    it("Should mint Solly token and reward", async function () {
      const level = 3;
      const metadata = "test-metadata";
      
      const initialBalance = await sollyCoin.balanceOf(player1.address);
      
      await sollyCoin.connect(player1).mintSolly(level, metadata);
      
      const finalBalance = await sollyCoin.balanceOf(player1.address);
      const expectedReward = ethers.parseEther("300"); // 100 * level
      
      expect(finalBalance - initialBalance).to.equal(expectedReward);
    });

    it("Should claim level reward", async function () {
      const level = 5;
      await sollyCoin.connect(player1).updateGameProgress(level, 1000);
      
      const initialBalance = await sollyCoin.balanceOf(player1.address);
      await sollyCoin.connect(player1).claimLevelReward(level);
      
      const finalBalance = await sollyCoin.balanceOf(player1.address);
      const expectedReward = ethers.parseEther("500"); // 100 * level
      
      expect(finalBalance - initialBalance).to.equal(expectedReward);
    });

    it("Should not allow claiming reward for unreached level", async function () {
      await sollyCoin.connect(player1).updateGameProgress(3, 1000);
      
      await expect(
        sollyCoin.connect(player1).claimLevelReward(5)
      ).to.be.revertedWith("Level not reached yet");
    });
  });

  describe("SollyNFT ERC-721", function () {
    const mintPrice = ethers.parseEther("0.01");

    it("Should have correct name and symbol", async function () {
      expect(await sollyNFT.name()).to.equal("SollyNFT");
      expect(await sollyNFT.symbol()).to.equal("SOLLY");
    });

    it("Should mint NFT with correct metadata", async function () {
      const tokenURI = "ipfs://test-uri";
      const level = 5;
      const shape = "sphere";
      const size = 100;
      const kaboom = 50;
      const isSpecial = true;

      await sollyNFT.connect(player1).mintSollyNFT(
        player1.address,
        tokenURI,
        level,
        shape,
        size,
        kaboom,
        isSpecial,
        { value: mintPrice }
      );

      expect(await sollyNFT.ownerOf(1)).to.equal(player1.address);
      expect(await sollyNFT.tokenURI(1)).to.equal(tokenURI);

      const metadata = await sollyNFT.getSollyMetadata(1);
      expect(metadata.level).to.equal(level);
      expect(metadata.shape).to.equal(shape);
      expect(metadata.size).to.equal(size);
      expect(metadata.kaboom).to.equal(kaboom);
      expect(metadata.isSpecial).to.equal(isSpecial);
    });

    it("Should update NFT metadata", async function () {
      // First mint
      await sollyNFT.connect(player1).mintSollyNFT(
        player1.address,
        "ipfs://old-uri",
        1,
        "sphere",
        100,
        50,
        false,
        { value: mintPrice }
      );

      // Update metadata
      const newTokenURI = "ipfs://new-uri";
      const newLevel = 10;
      const newShape = "cube";
      const newSize = 200;
      const newKaboom = 100;

      await sollyNFT.connect(player1).updateSollyMetadata(
        1,
        newTokenURI,
        newLevel,
        newShape,
        newSize,
        newKaboom
      );

      expect(await sollyNFT.tokenURI(1)).to.equal(newTokenURI);

      const metadata = await sollyNFT.getSollyMetadata(1);
      expect(metadata.level).to.equal(newLevel);
      expect(metadata.shape).to.equal(newShape);
      expect(metadata.size).to.equal(newSize);
      expect(metadata.kaboom).to.equal(newKaboom);
    });

    it("Should not allow non-owner to update metadata", async function () {
      await sollyNFT.connect(player1).mintSollyNFT(
        player1.address,
        "ipfs://test-uri",
        1,
        "sphere",
        100,
        50,
        false,
        { value: mintPrice }
      );

      await expect(
        sollyNFT.connect(player2).updateSollyMetadata(
          1,
          "ipfs://new-uri",
          10,
          "cube",
          200,
          100
        )
      ).to.be.revertedWith("Not token owner");
    });
  });

  describe("GameFactory", function () {
    const entryFee = ethers.parseEther("0.01");
    const maxPlayers = 3;

    it("Should create game instance", async function () {
      await gameFactory.connect(player1).createGame(entryFee, maxPlayers, { value: entryFee });

      const game = await gameFactory.getGame(1);
      expect(game.creator).to.equal(player1.address);
      expect(game.entryFee).to.equal(entryFee);
      expect(game.maxPlayers).to.equal(maxPlayers);
      expect(game.currentPlayers).to.equal(1);
      expect(game.totalPrizePool).to.equal(entryFee);
    });

    it("Should allow players to join game", async function () {
      await gameFactory.connect(player1).createGame(entryFee, maxPlayers, { value: entryFee });
      await gameFactory.connect(player2).joinGame(1, { value: entryFee });

      const game = await gameFactory.getGame(1);
      expect(game.currentPlayers).to.equal(2);
      expect(game.totalPrizePool).to.equal(entryFee * 2n);
    });

    it("Should not allow joining full game", async function () {
      await gameFactory.connect(player1).createGame(entryFee, 2, { value: entryFee });
      await gameFactory.connect(player2).joinGame(1, { value: entryFee });

      await expect(
        gameFactory.connect(player3).joinGame(1, { value: entryFee })
      ).to.be.revertedWith("Game not available");
    });

    it("Should submit and track scores", async function () {
      await gameFactory.connect(player1).createGame(entryFee, maxPlayers, { value: entryFee });
      await gameFactory.connect(player2).joinGame(1, { value: entryFee });

      // Start game by filling it
      await gameFactory.connect(player3).joinGame(1, { value: entryFee });

      const score1 = 1000;
      const score2 = 1500;
      const score3 = 800;

      await gameFactory.connect(player1).submitScore(1, score1);
      await gameFactory.connect(player2).submitScore(1, score2);
      await gameFactory.connect(player3).submitScore(1, score3);

      expect(await gameFactory.getPlayerScore(1, player1.address)).to.equal(score1);
      expect(await gameFactory.getPlayerScore(1, player2.address)).to.equal(score2);
      expect(await gameFactory.getPlayerScore(1, player3.address)).to.equal(score3);
    });

    it("Should complete game and distribute rewards", async function () {
      await gameFactory.connect(player1).createGame(entryFee, 2, { value: entryFee });
      await gameFactory.connect(player2).joinGame(1, { value: entryFee });

      // Submit scores
      await gameFactory.connect(player1).submitScore(1, 1000);
      await gameFactory.connect(player2).submitScore(1, 1500);

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");

      const initialBalance = await ethers.provider.getBalance(player2.address);
      await gameFactory.connect(player1).completeGame(1);
      const finalBalance = await ethers.provider.getBalance(player2.address);

      // Player2 should have won and received reward (minus platform fee)
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should cancel game and refund players", async function () {
      await gameFactory.connect(player1).createGame(entryFee, maxPlayers, { value: entryFee });
      await gameFactory.connect(player2).joinGame(1, { value: entryFee });

      const initialBalance = await ethers.provider.getBalance(player2.address);
      await gameFactory.connect(player1).cancelGame(1);
      const finalBalance = await ethers.provider.getBalance(player2.address);

      expect(finalBalance).to.equal(initialBalance + entryFee);
    });
  });

  describe("Integration Tests", function () {
    it("Should integrate game progress with SollyCoin rewards", async function () {
      // Player completes game and gets SollyCoins
      const level = 5;
      await sollyCoin.connect(player1).updateGameProgress(level, 1000);
      await sollyCoin.connect(player1).claimLevelReward(level);

      const balance = await sollyCoin.balanceOf(player1.address);
      expect(balance).to.be.gt(0);
    });

    it("Should mint NFT after game achievement", async function () {
      const mintPrice = ethers.parseEther("0.01");
      
      // Player mints NFT for achievement
      await sollyNFT.connect(player1).mintSollyNFT(
        player1.address,
        "ipfs://achievement-uri",
        10,
        "special",
        150,
        75,
        true,
        { value: mintPrice }
      );

      expect(await sollyNFT.ownerOf(1)).to.equal(player1.address);
    });
  });
}); 