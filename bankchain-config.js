/**
 * BankChain Configuration
 * 
 * This file contains configuration for the BankChain independent blockchain.
 * It uses your legal entity information to create a properly regulated
 * blockchain solution for financial services.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Legal Entity Information
const legalEntityInfo = {
  name: process.env.LEGAL_ENTITY_NAME || 'Test Corporation',
  leiCode: process.env.LEI_CODE || 'ABCDEFGHIJ1234567890',
  subsidiaryLeiCode: process.env.LEI_SUBSIDIARY_CODE || 'PQRSTUVWXY0987654321',
  jurisdiction: process.env.LEGAL_JURISDICTION || 'United States:Delaware',
  entityId: parseInt(process.env.LEGAL_ENTITY_ID || '1')
};

// Network Configuration
const networkConfig = {
  mainnetUrl: process.env.BANK_CHAIN_MAINNET_URL || '',
  testnetUrl: process.env.BANK_CHAIN_TESTNET_URL || '',
  localnetUrl: process.env.BANK_CHAIN_LOCALNET_URL || 'http://localhost:8545',
  blockTime: parseInt(process.env.BANK_CHAIN_BLOCK_TIME || '15'),
  initialDifficulty: parseInt(process.env.BANK_CHAIN_INITIAL_DIFFICULTY || '1'),
  genesisTimestamp: process.env.BANK_CHAIN_GENESIS_TIMESTAMP || new Date().toISOString()
};

// Consensus Configuration
const consensusConfig = {
  mechanism: process.env.CONSENSUS_MECHANISM || 'POS', // POS, POW, or POA
  validatorMinStake: parseInt(process.env.VALIDATOR_MIN_STAKE || '10000'),
  validatorReward: parseInt(process.env.VALIDATOR_REWARD_AMOUNT || '50'),
  rewardHalvingBlock: parseInt(process.env.VALIDATOR_REWARD_HALVING_BLOCK || '2100000')
};

// Genesis Block Configuration
const generateGenesisBlock = () => {
  return {
    timestamp: networkConfig.genesisTimestamp,
    difficulty: networkConfig.initialDifficulty,
    nonce: 0,
    extraData: `BankChain Genesis - ${legalEntityInfo.name} (${legalEntityInfo.leiCode})`,
    alloc: {
      // Pre-allocate funds to deployer account
      [process.env.DEPLOYER_PRIVATE_KEY ? getAddressFromPrivateKey(process.env.DEPLOYER_PRIVATE_KEY) : '0x0000000000000000000000000000000000000000']: {
        balance: '100000000000000000000000' // 100,000 BankCoin
      }
    }
  };
};

// Helper function to get address from private key (mock implementation)
const getAddressFromPrivateKey = (privateKey) => {
  // In a real implementation, this would derive an address from a private key
  return '0x0000000000000000000000000000000000000000';
};

// Export the configuration
module.exports = {
  legalEntityInfo,
  networkConfig,
  consensusConfig,
  generateGenesisBlock,
  getContracts: () => {
    return {
      bankCoinAddress: process.env.BANK_COIN_CONTRACT_ADDRESS || '',
      bankChainAddress: process.env.BANK_CHAIN_CONTRACT_ADDRESS || ''
    };
  },
  generatePrivateBlockchainConfig: () => {
    // This function would generate configuration files for a private blockchain
    // like genesis.json for Geth or similar configurations for other clients
    
    const genesisConfig = {
      config: {
        chainId: 2025,
        homesteadBlock: 0,
        eip150Block: 0,
        eip155Block: 0,
        eip158Block: 0,
        byzantiumBlock: 0,
        constantinopleBlock: 0,
        petersburgBlock: 0,
        istanbulBlock: 0,
        berlinBlock: 0,
        londonBlock: 0,
        clique: consensusConfig.mechanism === 'POA' ? {
          period: networkConfig.blockTime,
          epoch: 30000
        } : undefined,
        ethash: consensusConfig.mechanism === 'POW' ? {} : undefined
      },
      difficulty: networkConfig.initialDifficulty.toString(),
      gasLimit: "8000000",
      extradata: consensusConfig.mechanism === 'POA' ? 
        `0x0000000000000000000000000000000000000000000000000000000000000000${
          process.env.DEPLOYER_PRIVATE_KEY ? getAddressFromPrivateKey(process.env.DEPLOYER_PRIVATE_KEY).substring(2) : ''
        }0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000` : 
        "0x",
      alloc: generateGenesisBlock().alloc
    };
    
    // Write genesis.json file
    const genesisPath = path.join(__dirname, 'genesis.json');
    fs.writeFileSync(genesisPath, JSON.stringify(genesisConfig, null, 2));
    
    console.log(`Genesis configuration written to ${genesisPath}`);
    return genesisPath;
  }
};