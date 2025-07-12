# SollyCoin dApp Deployment Guide

## 📋 Overzicht

Deze guide helpt je bij het deployen van de SollyCoin dApp naar verschillende netwerken. De dApp bestaat uit drie hoofdcontracten:

1. **SollyCoin** - ERC-20 token voor game rewards
2. **SollyNFT** - ERC-721 collectibles
3. **GameFactory** - Multiplayer game management

## 🛠️ Voorbereiding

### 1. Dependencies installeren

```bash
npm install
```

### 2. Environment configuratie

Kopieer `env.example` naar `.env` en vul de benodigde waarden in:

```bash
cp env.example .env
```

**Vereiste variabelen:**
- `SEPOLIA_URL` - Infura/Alchemy endpoint voor Sepolia testnet
- `MUMBAI_URL` - Infura/Alchemy endpoint voor Polygon Mumbai testnet
- `PRIVATE_KEY` - Private key van je deployment wallet
- `ETHERSCAN_API_KEY` - Etherscan API key voor contract verificatie
- `POLYGONSCAN_API_KEY` - Polygonscan API key voor contract verificatie

### 3. Wallet setup

Zorg ervoor dat je deployment wallet voldoende ETH/MATIC heeft:
- **Sepolia**: Minimaal 0.1 ETH voor deployment en gas
- **Mumbai**: Minimaal 10 MATIC voor deployment en gas

## 🚀 Deployment Stappen

### Fase 1: Lokale Development

```bash
# Start lokale Hardhat node
npm run node

# In nieuwe terminal, deploy naar localhost
npm run deploy:local
```

### Fase 2: Testnet Deployment

#### Sepolia (Ethereum Testnet)

```bash
# Deploy naar Sepolia
npm run deploy:sepolia

# Verificeer contracts op Etherscan
npm run verify:sepolia
```

#### Mumbai (Polygon Testnet)

```bash
# Deploy naar Mumbai
npm run deploy:mumbai

# Verificeer contracts op Polygonscan
npm run verify:mumbai
```

### Fase 3: Contract Addresses Updaten

Na deployment, update de contract addresses in `src/Web3Manager.js`:

```javascript
const contractAddresses = {
    SollyCoin: "0x...", // Nieuwe SollyCoin address
    SollyNFT: "0x...",  // Nieuwe SollyNFT address
    GameFactory: "0x..." // Nieuwe GameFactory address
};
```

## 📊 Deployment Output

Na succesvolle deployment krijg je:

```
🚀 Starting SollyCoin dApp deployment...
📝 Deploying contracts with account: 0x...
💰 Account balance: 1.234567890123456789 ETH

📦 Deploying SollyCoin ERC-20...
✅ SollyCoin deployed to: 0x1234...

🎨 Deploying SollyNFT...
✅ SollyNFT deployed to: 0x5678...

🎮 Deploying GameFactory...
✅ GameFactory deployed to: 0x9abc...

🔐 Setting up permissions...
✅ Granted minting role to GameFactory

📋 Deployment Summary:
Network: sepolia
Deployer: 0x...
SollyCoin: 0x1234...
SollyNFT: 0x5678...
GameFactory: 0x9abc...

💾 Deployment info saved to: deployments/sepolia.json
```

## 🔧 Contract Configuratie

### SollyCoin ERC-20
- **Initial Supply**: 1,000,000 SOLLY
- **Reward per Level**: 100 SOLLY
- **Max Level**: 100

### SollyNFT ERC-721
- **Max Supply**: 10,000 NFTs
- **Mint Price**: 0.01 ETH/MATIC
- **Metadata**: IPFS-based

### GameFactory
- **Min Entry Fee**: 0.001 ETH/MATIC
- **Max Entry Fee**: 1 ETH/MATIC
- **Min Players**: 2
- **Max Players**: 10
- **Game Duration**: 1 hour
- **Platform Fee**: 2%

## 🧪 Testing

### Unit Tests

```bash
# Run alle tests
npm test

# Run specifieke test file
npx hardhat test test/SollyCoin.test.js
```

### Integration Tests

```bash
# Test contract interacties
npx hardhat test test/Integration.test.js
```

### Gas Testing

```bash
# Gas usage rapport
REPORT_GAS=true npm test
```

## 🔍 Contract Verificatie

### Etherscan (Sepolia)

1. Ga naar [Etherscan Sepolia](https://sepolia.etherscan.io/)
2. Zoek je contract address
3. Klik op "Contract" tab
4. Klik op "Verify and Publish"
5. Vul contract details in

### Polygonscan (Mumbai)

1. Ga naar [Polygonscan Mumbai](https://mumbai.polygonscan.com/)
2. Zoek je contract address
3. Klik op "Contract" tab
4. Klik op "Verify and Publish"
5. Vul contract details in

## 🌐 dApp Deployment

### Lokale Development

```bash
# Start development server
npm start

# Open browser naar http://localhost:5501
```

### Productie Deployment

1. **Vercel** (aanbevolen):
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**:
   - Upload project naar GitHub
   - Connect met Netlify
   - Deploy automatisch

3. **IPFS**:
   ```bash
   # Build project
   npm run build
   
   # Upload naar IPFS
   npx ipfs-deploy dist
   ```

## 🔐 Security Checklist

- [ ] Private keys veilig opgeslagen
- [ ] Environment variables niet in git
- [ ] Contract addresses geverifieerd
- [ ] Gas limits geoptimaliseerd
- [ ] Access controls getest
- [ ] Reentrancy protection actief
- [ ] Pausable functionaliteit getest

## 📈 Monitoring

### Contract Events

Monitor belangrijke events:
- `GameProgressUpdated`
- `SollyMinted`
- `SollyNFTMinted`
- `GameInstanceCreated`
- `GameCompleted`

### Gas Usage

Track gas usage per functie:
```bash
REPORT_GAS=true npm test
```

### Error Handling

Implementeer error handling in frontend:
```javascript
try {
    await contract.methods.functionName().send();
} catch (error) {
    console.error("Transaction failed:", error);
    // Show user-friendly error message
}
```

## 🚨 Troubleshooting

### Veelvoorkomende Problemen

1. **Insufficient Gas**
   ```
   Error: insufficient funds for gas * price + value
   ```
   **Oplossing**: Voeg meer ETH/MATIC toe aan wallet

2. **Contract Already Deployed**
   ```
   Error: contract already deployed
   ```
   **Oplossing**: Gebruik nieuwe contract addresses

3. **Verification Failed**
   ```
   Error: Already Verified
   ```
   **Oplossing**: Contract is al geverifieerd

4. **Network Mismatch**
   ```
   Error: network mismatch
   ```
   **Oplossing**: Check network configuratie

### Debug Commands

```bash
# Check network status
npx hardhat console --network sepolia

# Get contract info
npx hardhat run scripts/getContractInfo.js --network sepolia

# Check deployment status
npx hardhat run scripts/checkDeployment.js --network sepolia
```

## 📞 Support

Voor vragen of problemen:

1. Check de [README.md](README.md)
2. Bekijk de [DAPP_ROADMAP.md](DAPP_ROADMAP.md)
3. Open een issue op GitHub
4. Contacteer het SollyCoin team

## 🎯 Volgende Stappen

Na succesvolle deployment:

1. **Test alle functionaliteit** op testnet
2. **Update frontend** met nieuwe contract addresses
3. **Deploy naar mainnet** (wanneer klaar)
4. **Implementeer monitoring** en analytics
5. **Plan marketing** en community building

---

**Succes met je SollyCoin dApp deployment! 🚀** 