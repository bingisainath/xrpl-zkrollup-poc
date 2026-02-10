$ npx hardhat run scripts/4_deploy.js --network xrpl-evm-testnet
============================================
  ZK-Rollup PoC — Contract Deployment
============================================

  Network:  xrpl-evm-testnet
  Deployer: 0xf057956b77Eb1D6B9b6dA5EEc06fD089f743e6c1
  Balance:  92.28845 ETH

  Genesis state root: 3016020

[1/2] Deploying Groth16Verifier...
   ✅ Verifier deployed at: 0xC7102A6489b10F63f5403e5ACA7cF757249A5996

[2/2] Deploying Rollup...
   ✅ Rollup deployed at: 0x3127BF60CAB4B5348b51CEe887Cf44B5d7e7E602

  Post-deployment verification:
    State root: 3016020
    Operator:   0xf057956b77Eb1D6B9b6dA5EEc06fD089f743e6c1
    Batch count: 0

============================================
  ✅ Deployment Complete!
============================================

  Saved to: build\deployment_xrpl-evm-testnet.json

  Verifier: 0xC7102A6489b10F63f5403e5ACA7cF757249A5996
  Rollup:   0x3127BF60CAB4B5348b51CEe887Cf44B5d7e7E602

  Next step: npx hardhat run scripts/5_submit_rollup.js --network xrpl-evm-testnet

  Update your .env file:
    VERIFIER_CONTRACT_ADDRESS=0xC7102A6489b10F63f5403e5ACA7cF757249A5996
    ROLLUP_CONTRACT_ADDRESS=0x3127BF60CAB4B5348b51CEe887Cf44B5d7e7E602

bingi@Shirisha MINGW64 ~/github.com/bingisainath/xrpl-zkrollup-poc/zk-rollup-poc (main)
$ npx hardhat run scripts/5_submit_rollup.js --network xrpl-evm-testnet
============================================
  ZK-Rollup PoC — Batch Proof Submission
============================================

  Network:    xrpl-evm-testnet
  Submitter:  0xf057956b77Eb1D6B9b6dA5EEc06fD089f743e6c1

  Rollup contract:   0x3127BF60CAB4B5348b51CEe887Cf44B5d7e7E602
  Verifier contract: 0xC7102A6489b10F63f5403e5ACA7cF757249A5996

  Old state root: 3016020
  New state root: 12057063

  Pre-submission state:
    Current root:   3016020
    Batch count:    0
    Operator:       0xf057956b77Eb1D6B9b6dA5EEc06fD089f743e6c1
    Signer match:   ✅

[1/2] Submitting rollup batch proof...
       (calling Rollup.submitBatch)

  Transaction hash: 0xc31625ca059359d4b077c6e54d95be2c9def4a653b7fd946d6f52018151be95c
  Waiting for confirmation...
  ✅ Confirmed in block 5394559
  Gas used: 257022

  📋 BatchVerified Event:
     Batch ID:       1
     Old State Root: 3016020
     New State Root: 12057063
     Submitter:      0xf057956b77Eb1D6B9b6dA5EEc06fD089f743e6c1

[2/2] Verifying on-chain state...
  New state root:  12057063
  Batch count:     1

============================================
  ✅ ROLLUP BATCH SUCCESSFULLY VERIFIED!
============================================
  The zk-SNARK proof was verified on-chain
  and the rollup state root has been updated.
============================================

  Result saved to: build\batch_result_xrpl-evm-testnet.json

bingi@Shirisha MINGW64 ~/github.com/bingisainath/xrpl-zkrollup-poc/zk-rollup-poc (main)
$




[7:28:02 PM] Connected! Chain ID: 1449000
[7:28:02 PM] Account A: 0xf057956b77eb1d6b9b6da5eec06fd089f743e6c1
[7:28:02 PM] Balance A: 92.294225 ETH
[7:28:02 PM] ℹ️ Only 1 account connected. See options below to add Account B.
[7:28:04 PM] Opening MetaMask — please select additional account(s)...
[7:28:25 PM] MetaMask returned 2 account(s)
[7:28:25 PM] Account B set: 0xb91009ee8efe31a2a8be13c3d243e0bb3746801d
[7:28:32 PM] Sending 0.001 ETH: Account A → Account B
[7:28:40 PM] TX submitted: 0x43f0f30ee3d1198fcdd90c6db216012fb6fe31c5756fd48127b3a09f22e99383
[7:28:40 PM] Waiting for confirmation...
[7:28:43 PM] ✅ Confirmed in block 5394362 (gas: 21000)
[7:28:52 PM] ⚠️ Please switch MetaMask to Account B (0xb91009ee8e...)
[7:28:52 PM]    Currently active: 0xf057956b77...
[7:28:59 PM] ⚠️ Please switch MetaMask to Account B (0xb91009ee8e...)
[7:28:59 PM]    Currently active: 0xf057956b77...
[7:29:35 PM] ⚠️ Please switch MetaMask to Account B (0xb91009ee8e...)
[7:29:35 PM]    Currently active: 0xf057956b77...
[7:30:03 PM] ⚠️ Please switch MetaMask to Account B (0xb91009ee8e...)
[7:30:03 PM]    Currently active: 0xf057956b77...
[7:30:10 PM] Sending 0.001 ETH: Account B → Account A
[7:30:18 PM] Transaction rejected by user.
[7:32:54 PM] Sending 0.001 ETH: Account B → Account A
[7:32:58 PM] TX submitted: 0x8cb8f8d4e9dd36e8bec4cc9c4f63adfd1fcfe934291d2e25bf5c95b632e2f272
[7:32:58 PM] Waiting for confirmation...
[7:33:05 PM] ✅ Confirmed in block 5394408 (gas: 21000)
[7:33:10 PM] ✅ Batch exported!
[7:33:10 PM]    Old root: 3016020
[7:33:10 PM]    New root: 12057063