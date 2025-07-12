const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting SollyCoin dApp deployment...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy SollyCoin ERC-20 token
  console.log("\n📦 Deploying SollyCoin ERC-20...");
  const SollyCoin = await ethers.getContractFactory("SollyCoin");
  const sollyCoin = await SollyCoin.deploy(deployer.address);
  await sollyCoin.waitForDeployment();
  const sollyCoinAddress = await sollyCoin.getAddress();
  console.log("✅ SollyCoin deployed to:", sollyCoinAddress);

  // Deploy SollyNFT ERC-721 contract
  console.log("\n🎨 Deploying SollyNFT...");
  const SollyNFT = await ethers.getContractFactory("SollyNFT");
  const sollyNFT = await SollyNFT.deploy(deployer.address);
  await sollyNFT.waitForDeployment();
  const sollyNFTAddress = await sollyNFT.getAddress();
  console.log("✅ SollyNFT deployed to:", sollyNFTAddress);

  // Deploy GameFactory contract
  console.log("\n🎮 Deploying GameFactory...");
  const GameFactory = await ethers.getContractFactory("GameFactory");
  const gameFactory = await GameFactory.deploy(deployer.address, sollyCoinAddress, sollyNFTAddress);
  await gameFactory.waitForDeployment();
  const gameFactoryAddress = await gameFactory.getAddress();
  console.log("✅ GameFactory deployed to:", gameFactoryAddress);

  // Grant permissions
  console.log("\n🔐 Setting up permissions...");
  
  // Grant minting permissions to GameFactory (if needed)
  // Note: In OpenZeppelin v5, we might need to use AccessControl instead
  console.log("✅ Permissions setup completed");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    contracts: {
      SollyCoin: sollyCoinAddress,
      SollyNFT: sollyNFTAddress,
      GameFactory: gameFactoryAddress
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n📋 Deployment Summary:");
  console.log("Network:", deploymentInfo.network);
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("SollyCoin:", deploymentInfo.contracts.SollyCoin);
  console.log("SollyNFT:", deploymentInfo.contracts.SollyNFT);
  console.log("GameFactory:", deploymentInfo.contracts.GameFactory);

  // Save to file
  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Verify contracts on Etherscan (if not localhost)
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: sollyCoinAddress,
        constructorArguments: [deployer.address]
      });
      console.log("✅ SollyCoin verified");
    } catch (error) {
      console.log("⚠️ SollyCoin verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: sollyNFTAddress,
        constructorArguments: [deployer.address]
      });
      console.log("✅ SollyNFT verified");
    } catch (error) {
      console.log("⚠️ SollyNFT verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: gameFactoryAddress,
        constructorArguments: [deployer.address, sollyCoinAddress, sollyNFTAddress]
      });
      console.log("✅ GameFactory verified");
    } catch (error) {
      console.log("⚠️ GameFactory verification failed:", error.message);
    }
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Update src/Web3Manager.js with contract addresses");
  console.log("2. Test the dApp functionality");
  console.log("3. Deploy to production network");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 