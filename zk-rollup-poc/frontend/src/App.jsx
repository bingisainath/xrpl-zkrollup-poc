import React, { useState, useCallback, useEffect } from "react";
import { BrowserProvider, formatEther, parseEther } from "ethers";

/* ============================================================
   ZK-Rollup PoC — MetaMask Transaction Dashboard
   ============================================================
   This frontend:
   1. Connects to MetaMask (handles single or multi-account)
   2. Allows manual entry of Account B if only one is connected
   3. Executes real testnet ETH transfers via MetaMask signing
   4. Captures transaction data for the rollup batch
   5. Exports captured data as JSON for proof generation
   ============================================================ */

// ---------- Hash functions (must match circom circuit) ----------
const FIELD_PRIME = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

function hashTwo(a, b) {
  a = BigInt(a); b = BigInt(b);
  let r = ((a * b) % FIELD_PRIME + a + b + 1n) % FIELD_PRIME;
  return r < 0n ? r + FIELD_PRIME : r;
}

function hashThree(a, b, c) { return hashTwo(hashTwo(a, b), c); }
function accountLeaf(pk, bal, nonce) { return hashThree(pk, bal, nonce); }
function computeStateRoot(l0, l1) { return hashTwo(l0, l1); }

// ---------- Styles ----------
const s = {
  app: { fontFamily: "'Segoe UI',system-ui,sans-serif", maxWidth: 860, margin: "0 auto", padding: 24, background: "#0d1117", minHeight: "100vh", color: "#c9d1d9" },
  h1: { color: "#58a6ff", borderBottom: "1px solid #30363d", paddingBottom: 12, fontSize: 28 },
  h2: { color: "#79c0ff", marginTop: 0, marginBottom: 12, fontSize: 20 },
  h3: { color: "#79c0ff", marginBottom: 8, fontSize: 16 },
  card: { background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: 16, marginBottom: 16 },
  innerCard: { background: "#0d1117", border: "1px solid #30363d", borderRadius: 8, padding: 12, marginBottom: 8 },
  btn: { padding: "10px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "opacity 0.2s" },
  btnPrimary: { background: "#238636", color: "#fff" },
  btnSecondary: { background: "#30363d", color: "#c9d1d9" },
  btnBlue: { background: "#1f6feb", color: "#fff" },
  btnDisabled: { background: "#21262d", color: "#484f58", cursor: "not-allowed" },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid #30363d", background: "#0d1117", color: "#c9d1d9", fontSize: 14 },
  inputWide: { width: "100%", boxSizing: "border-box" },
  mono: { fontFamily: "monospace", fontSize: 13, wordBreak: "break-all" },
  badge: { display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
  success: { background: "#1a4731", color: "#3fb950" },
  warning: { background: "#3d2e00", color: "#d29922" },
  info: { background: "#0c2d6b", color: "#58a6ff" },
  label: { display: "block", fontSize: 13, color: "#8b949e", marginBottom: 4 },
  row: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  log: { background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, padding: 12, maxHeight: 200, overflowY: "auto", fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap" },
  hint: { fontSize: 13, color: "#8b949e", marginTop: 4, lineHeight: 1.5 },
  divider: { border: "none", borderTop: "1px solid #30363d", margin: "16px 0" },
  stepBadge: { display: "inline-block", background: "#1f6feb", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 700, marginRight: 8 },
};

// ---------- Component ----------
export default function App() {
  const [provider, setProvider] = useState(null);
  const [accountA, setAccountA] = useState(null);
  const [accountB, setAccountB] = useState(null);
  const [accountBManual, setAccountBManual] = useState("");
  const [balanceA, setBalanceA] = useState(null);
  const [balanceB, setBalanceB] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [txAmount, setTxAmount] = useState("0.001");
  const [transactions, setTransactions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [rollupExport, setRollupExport] = useState(null);
  const [pendingTx, setPendingTx] = useState(false);
  const [activeAccount, setActiveAccount] = useState(null);

  const log = useCallback((msg) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${ts}] ${msg}`]);
  }, []);

  // ---- Listen for MetaMask account changes ----
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accts) => {
      if (accts.length > 0) {
        const addr = accts[0].toLowerCase();
        setActiveAccount(addr);
      }
    };

    const handleChainChanged = (id) => {
      setChainId(parseInt(id, 16));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  // ---- Auto-detect Account B when user switches in MetaMask ----
  useEffect(() => {
    if (activeAccount && accountA && !accountB) {
      if (activeAccount !== accountA.toLowerCase()) {
        // User switched to a new account — offer to set it as B
        const checksumAddr = activeAccount.slice(0, 2) + activeAccount.slice(2);
        setAccountB(checksumAddr);
        log(`Account B auto-detected: ${checksumAddr.slice(0, 12)}...`);
        if (provider) {
          provider.getBalance(checksumAddr).then(b => {
            setBalanceB(formatEther(b));
            log(`Balance B: ${formatEther(b)} ETH`);
          }).catch(() => {});
        }
      }
    }
  }, [activeAccount, accountA, accountB, provider]);

  // ---- Connect MetaMask ----
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install MetaMask.");
      return;
    }
    try {
      const p = new BrowserProvider(window.ethereum);
      const accts = await p.send("eth_requestAccounts", []);
      const network = await p.getNetwork();

      setProvider(p);
      setChainId(Number(network.chainId));
      setActiveAccount(accts[0].toLowerCase());
      setAccountA(accts[0]);

      const balA = await p.getBalance(accts[0]);
      setBalanceA(formatEther(balA));
      log(`Connected! Chain ID: ${network.chainId}`);
      log(`Account A: ${accts[0]}`);
      log(`Balance A: ${formatEther(balA)} ETH`);

      if (accts.length >= 2) {
        setAccountB(accts[1]);
        const balB = await p.getBalance(accts[1]);
        setBalanceB(formatEther(balB));
        log(`Account B: ${accts[1]}`);
        log(`Balance B: ${formatEther(balB)} ETH`);
      } else {
        log("ℹ️ Only 1 account connected. See options below to add Account B.");
      }
    } catch (err) {
      log(`Connection error: ${err.message}`);
    }
  };

  // ---- Add second account via MetaMask permissions ----
  const requestMoreAccounts = async () => {
    if (!window.ethereum) return;
    try {
      log("Opening MetaMask — please select additional account(s)...");
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accts = await window.ethereum.request({ method: "eth_accounts" });
      log(`MetaMask returned ${accts.length} account(s)`);

      if (accts.length >= 2) {
        const bAddr = accts.find(a => a.toLowerCase() !== accountA.toLowerCase()) || accts[1];
        setAccountB(bAddr);
        const p = provider || new BrowserProvider(window.ethereum);
        const balB = await p.getBalance(bAddr);
        setBalanceB(formatEther(balB));
        log(`Account B set: ${bAddr}`);
      } else if (accts.length === 1 && accts[0].toLowerCase() !== accountA?.toLowerCase()) {
        setAccountB(accts[0]);
        const p = provider || new BrowserProvider(window.ethereum);
        const balB = await p.getBalance(accts[0]);
        setBalanceB(formatEther(balB));
        log(`Account B set (switched): ${accts[0]}`);
      } else {
        log("Same account returned. Try Method 2 or 3 below.");
      }
    } catch (err) {
      if (err.code === 4001) {
        log("User rejected the permission request.");
      } else {
        log(`Error: ${err.message}`);
      }
    }
  };

  // ---- Set Account B manually ----
  const setAccountBManually = async () => {
    const addr = accountBManual.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      log("Invalid address format. Must be 0x followed by 40 hex characters.");
      return;
    }
    if (addr.toLowerCase() === accountA?.toLowerCase()) {
      log("Account B must be different from Account A.");
      return;
    }
    setAccountB(addr);
    log(`Account B set manually: ${addr}`);
    if (provider) {
      try {
        const bal = await provider.getBalance(addr);
        setBalanceB(formatEther(bal));
        log(`Balance B: ${formatEther(bal)} ETH`);
      } catch (e) {
        setBalanceB("error");
        log(`Could not fetch balance for Account B: ${e.message}`);
      }
    }
  };

  // ---- Refresh all balances ----
  const refreshBalances = async () => {
    if (!provider) return;
    if (accountA) {
      const bA = await provider.getBalance(accountA);
      setBalanceA(formatEther(bA));
    }
    if (accountB) {
      const bB = await provider.getBalance(accountB);
      setBalanceB(formatEther(bB));
    }
    log("Balances refreshed");
  };

  // ---- Execute transaction ----
  const sendTransaction = async (direction) => {
    if (!accountA || !accountB) {
      log("ERROR: Both Account A and Account B must be set.");
      return;
    }

    const from = direction === "AtoB" ? accountA : accountB;
    const to = direction === "AtoB" ? accountB : accountA;
    const fromIdx = direction === "AtoB" ? 0 : 1;
    const toIdx = direction === "AtoB" ? 1 : 0;
    const fromLabel = direction === "AtoB" ? "A" : "B";
    const toLabel = direction === "AtoB" ? "B" : "A";

    if (activeAccount && activeAccount !== from.toLowerCase()) {
      log(`⚠️ Please switch MetaMask to Account ${fromLabel} (${from.slice(0, 12)}...)`);
      log(`   Currently active: ${activeAccount.slice(0, 12)}...`);
      alert(`Please switch MetaMask to Account ${fromLabel}:\n${from}\n\nCurrently selected:\n${activeAccount}`);
      return;
    }

    setPendingTx(true);
    log(`Sending ${txAmount} ETH: Account ${fromLabel} → Account ${toLabel}`);

    try {
      const freshProvider = new BrowserProvider(window.ethereum);
      const signer = await freshProvider.getSigner();
      const signerAddr = await signer.getAddress();

      if (signerAddr.toLowerCase() !== from.toLowerCase()) {
        log(`❌ MetaMask signer (${signerAddr.slice(0, 12)}...) doesn't match expected sender.`);
        log(`   Switch MetaMask to Account ${fromLabel}: ${from.slice(0, 12)}...`);
        setPendingTx(false);
        return;
      }

      const tx = await signer.sendTransaction({
        to: to,
        value: parseEther(txAmount),
      });

      log(`TX submitted: ${tx.hash}`);
      log("Waiting for confirmation...");

      const receipt = await tx.wait();
      log(`✅ Confirmed in block ${receipt.blockNumber} (gas: ${receipt.gasUsed.toString()})`);

      const txRecord = {
        from, to, fromIdx, toIdx,
        value: txAmount,
        nonce: tx.nonce,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: new Date().toISOString(),
        status: "confirmed",
        label: `Account ${fromLabel} → Account ${toLabel}`,
      };

      setTransactions(prev => [...prev, txRecord]);

      setProvider(freshProvider);
      const bA = await freshProvider.getBalance(accountA);
      const bB = await freshProvider.getBalance(accountB);
      setBalanceA(formatEther(bA));
      setBalanceB(formatEther(bB));
    } catch (err) {
      if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        log("Transaction rejected by user.");
      } else {
        log(`❌ Transaction failed: ${err.message}`);
      }
    } finally {
      setPendingTx(false);
    }
  };

  // ---- Export for rollup ----
  const exportForRollup = () => {
    if (transactions.length < 2) {
      log("Need at least 2 confirmed transactions to create a batch.");
      return;
    }

    const PUBKEY_A = 1n;
    const PUBKEY_B = 2n;
    const initialBalA = 1000n;
    const initialBalB = 500n;
    const SCALE = 1000000n;

    const batch = transactions.slice(0, 2);
    const txList = batch.map((tx) => ({
      from: tx.fromIdx,
      to: tx.toIdx,
      amount: Math.round(parseFloat(tx.value) * Number(SCALE)).toString(),
      nonce: "0",
      txHash: tx.txHash,
    }));

    let nonceA = 0, nonceB = 0;
    for (const tx of txList) {
      if (tx.from === 0) { tx.nonce = String(nonceA); nonceA++; }
      else { tx.nonce = String(nonceB); nonceB++; }
    }

    const leaf0_old = accountLeaf(PUBKEY_A, initialBalA, 0n);
    const leaf1_old = accountLeaf(PUBKEY_B, initialBalB, 0n);
    const oldRoot = computeStateRoot(leaf0_old, leaf1_old);

    let bA = initialBalA, bB = initialBalB, nA = 0n, nB = 0n;
    for (const tx of txList) {
      const amt = BigInt(tx.amount);
      if (tx.from === 0) { bA -= amt; bB += amt; nA += 1n; }
      else { bB -= amt; bA += amt; nB += 1n; }
    }

    const leaf0_new = accountLeaf(PUBKEY_A, bA, nA);
    const leaf1_new = accountLeaf(PUBKEY_B, bB, nB);
    const newRoot = computeStateRoot(leaf0_new, leaf1_new);

    const exportData = {
      accountA: { address: accountA, pubkeyId: "1" },
      accountB: { address: accountB, pubkeyId: "2" },
      initialBalanceA: initialBalA.toString(),
      initialBalanceB: initialBalB.toString(),
      initialNonceA: "0",
      initialNonceB: "0",
      transactions: txList,
      computedRoots: {
        oldStateRoot: oldRoot.toString(),
        newStateRoot: newRoot.toString(),
      },
      realTransactions: batch,
    };

    setRollupExport(exportData);
    log("✅ Batch exported!");
    log(`   Old root: ${oldRoot}`);
    log(`   New root: ${newRoot}`);
  };

  const downloadJson = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const bothAccountsReady = accountA && accountB;

  return (
    <div style={s.app}>
      <h1 style={s.h1}>🔐 ZK-Rollup PoC — Transaction Dashboard</h1>
      <p style={{ color: "#8b949e", marginBottom: 24 }}>
        Execute real testnet transactions via MetaMask, batch them off-chain,
        and generate a zk-SNARK proof for on-chain verification.
      </p>

      {/* ======== STEP 1: WALLET CONNECTION ======== */}
      <div style={s.card}>
        <h2 style={s.h2}><span style={s.stepBadge}>1</span> Wallet Connection</h2>

        {!accountA ? (
          <button style={{ ...s.btn, ...s.btnPrimary }} onClick={connectWallet}>
            Connect MetaMask
          </button>
        ) : (
          <>
            <div style={s.row}>
              <span style={{ ...s.badge, ...s.success }}>Connected — Chain {chainId}</span>
              {activeAccount && (
                <span style={{ ...s.badge, ...s.info }}>
                  Active: {activeAccount.slice(0, 8)}...{activeAccount.slice(-4)}
                </span>
              )}
            </div>

            {/* Account A */}
            <div style={{ ...s.innerCard, marginTop: 12, borderLeft: "3px solid #238636" }}>
              <strong style={{ color: "#3fb950" }}>Account A (index 0)</strong>
              <div style={s.mono}>{accountA}</div>
              <div style={{ marginTop: 4 }}>
                Balance: <strong>{balanceA ?? "..."} ETH</strong>
              </div>
            </div>

            {/* Account B */}
            {accountB ? (
              <div style={{ ...s.innerCard, borderLeft: "3px solid #1f6feb" }}>
                <div style={s.row}>
                  <strong style={{ color: "#58a6ff" }}>Account B (index 1)</strong>
                  <button
                    style={{ ...s.btn, ...s.btnSecondary, padding: "4px 10px", fontSize: 12 }}
                    onClick={() => { setAccountB(null); setBalanceB(null); setAccountBManual(""); }}
                  >
                    Change
                  </button>
                </div>
                <div style={s.mono}>{accountB}</div>
                <div style={{ marginTop: 4 }}>
                  Balance: <strong>{balanceB ?? "..."} ETH</strong>
                </div>
              </div>
            ) : (
              <div style={{ ...s.innerCard, borderLeft: "3px solid #d29922" }}>
                <strong style={{ color: "#d29922" }}>Account B — Not Set</strong>
                <p style={s.hint}>Choose one of the methods below to add your second account:</p>

                {/* Method 1 */}
                <div style={{ marginBottom: 16 }}>
                  <strong style={{ fontSize: 13, color: "#c9d1d9" }}>Method 1: Select from MetaMask</strong>
                  <p style={s.hint}>
                    Opens MetaMask's account picker. Check the second account to connect it.
                  </p>
                  <button style={{ ...s.btn, ...s.btnBlue, marginTop: 4 }} onClick={requestMoreAccounts}>
                    Open MetaMask Account Picker
                  </button>
                </div>

                <hr style={s.divider} />

                {/* Method 2 */}
                <div style={{ marginBottom: 16 }}>
                  <strong style={{ fontSize: 13, color: "#c9d1d9" }}>Method 2: Switch in MetaMask extension</strong>
                  <p style={s.hint}>
                    Click your MetaMask icon → switch to your second account.
                    The app will <strong>auto-detect</strong> the switch and set it as Account B.
                  </p>
                </div>

                <hr style={s.divider} />

                {/* Method 3 */}
                <div>
                  <strong style={{ fontSize: 13, color: "#c9d1d9" }}>Method 3: Paste address manually</strong>
                  <p style={s.hint}>
                    Copy your second account address from MetaMask and paste it below.
                    You'll switch to it in MetaMask when sending from Account B.
                  </p>
                  <div style={{ ...s.row, marginTop: 8 }}>
                    <input
                      style={{ ...s.input, ...s.inputWide, flex: 1 }}
                      type="text"
                      placeholder="0x..."
                      value={accountBManual}
                      onChange={(e) => setAccountBManual(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && setAccountBManually()}
                    />
                    <button style={{ ...s.btn, ...s.btnBlue }} onClick={setAccountBManually}>
                      Set
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 8 }}>
              <button style={{ ...s.btn, ...s.btnSecondary }} onClick={refreshBalances}>
                Refresh Balances
              </button>
            </div>
          </>
        )}
      </div>

      {/* ======== STEP 2: TRANSACTIONS ======== */}
      {accountA && (
        <div style={s.card}>
          <h2 style={s.h2}><span style={s.stepBadge}>2</span> Execute L2 Transactions</h2>

          {!bothAccountsReady ? (
            <div style={{ ...s.innerCard, borderLeft: "3px solid #d29922" }}>
              <span style={{ ...s.badge, ...s.warning }}>⚠️ Set Account B first</span>
              <p style={s.hint}>Complete Step 1 by adding Account B before sending transactions.</p>
            </div>
          ) : (
            <>
              <p style={s.hint}>
                Send real testnet ETH between your accounts. These represent L2 transactions consumed by the rollup.
                <br />
                <strong>Important:</strong> Switch MetaMask to the <em>sender</em> account before clicking the button.
              </p>

              <div style={{ ...s.row, marginTop: 12, marginBottom: 12 }}>
                <label style={{ fontSize: 14, color: "#c9d1d9" }}>Amount (ETH):</label>
                <input
                  style={{ ...s.input, width: 120 }}
                  type="text"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                />
              </div>

              <div style={{ ...s.row, marginBottom: 8 }}>
                <button
                  style={{ ...s.btn, ...(pendingTx ? s.btnDisabled : s.btnPrimary) }}
                  onClick={() => sendTransaction("AtoB")}
                  disabled={pendingTx}
                >
                  {pendingTx ? "⏳ Pending..." : "TX: A → B"}
                </button>
                <button
                  style={{ ...s.btn, ...(pendingTx ? s.btnDisabled : s.btnBlue) }}
                  onClick={() => sendTransaction("BtoA")}
                  disabled={pendingTx}
                >
                  {pendingTx ? "⏳ Pending..." : "TX: B → A"}
                </button>
              </div>

              {activeAccount && (
                <p style={{ ...s.hint, marginTop: 4 }}>
                  MetaMask active account:{" "}
                  <code style={{ color: "#58a6ff" }}>
                    {activeAccount.slice(0, 12)}...{activeAccount.slice(-4)}
                  </code>
                  {accountA && activeAccount === accountA.toLowerCase() && " (Account A ✅)"}
                  {accountB && activeAccount === accountB.toLowerCase() && " (Account B ✅)"}
                </p>
              )}

              <div style={{ ...s.innerCard, marginTop: 12, background: "#0d1117" }}>
                <strong style={{ fontSize: 13, color: "#8b949e" }}>💡 Workflow for 2 transactions:</strong>
                <ol style={{ margin: "8px 0 0 0", paddingLeft: 20, fontSize: 13, color: "#8b949e", lineHeight: 1.8 }}>
                  <li>Ensure MetaMask is on <strong style={{ color: "#3fb950" }}>Account A</strong> → Click <strong>"TX: A → B"</strong></li>
                  <li>Switch MetaMask to <strong style={{ color: "#58a6ff" }}>Account B</strong> → Click <strong>"TX: B → A"</strong></li>
                  <li>Export the batch in Step 3</li>
                </ol>
              </div>
            </>
          )}

          {transactions.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={s.h3}>Captured Transactions ({transactions.length})</h3>
              {transactions.map((tx, i) => (
                <div key={i} style={{ ...s.innerCard, borderLeft: `3px solid ${tx.status === "confirmed" ? "#3fb950" : "#d29922"}` }}>
                  <div style={{ ...s.row, justifyContent: "space-between" }}>
                    <strong>TX{i + 1}: {tx.label}</strong>
                    <span style={{ ...s.badge, ...s.success }}>{tx.status}</span>
                  </div>
                  <div style={{ ...s.mono, marginTop: 4 }}>
                    {tx.from.slice(0, 14)}... → {tx.to.slice(0, 14)}...
                  </div>
                  <div style={{ fontSize: 13, color: "#8b949e", marginTop: 2 }}>
                    Value: {tx.value} ETH &nbsp;|&nbsp; Block: {tx.blockNumber} &nbsp;|&nbsp; Nonce: {tx.nonce}
                  </div>
                  <div style={{ ...s.mono, fontSize: 11, color: "#484f58", marginTop: 2 }}>
                    {tx.txHash}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======== STEP 3: BATCH EXPORT ======== */}
      {transactions.length >= 2 && (
        <div style={s.card}>
          <h2 style={s.h2}><span style={s.stepBadge}>3</span> Export Batch for Proof Generation</h2>
          <p style={s.hint}>
            Bundle your confirmed transactions into a rollup batch.
            The exported JSON feeds into the zk-SNARK proof generation pipeline.
          </p>

          <button style={{ ...s.btn, ...s.btnPrimary, marginTop: 8 }} onClick={exportForRollup}>
            Generate Rollup Batch
          </button>

          {rollupExport && (
            <div style={{ marginTop: 16 }}>
              <div style={{ ...s.innerCard, borderLeft: "3px solid #3fb950" }}>
                <strong style={{ color: "#3fb950" }}>✅ Batch Ready</strong>
                <div style={{ fontSize: 13, color: "#8b949e", marginTop: 4 }}>
                  Old State Root: <code>{rollupExport.computedRoots.oldStateRoot}</code>
                </div>
                <div style={{ fontSize: 13, color: "#8b949e" }}>
                  New State Root: <code>{rollupExport.computedRoots.newStateRoot}</code>
                </div>
              </div>

              <p style={{ ...s.hint, marginTop: 12 }}>
                Download the JSON file and run:
              </p>
              <pre style={{ ...s.log, marginTop: 4, padding: 8 }}>
{`node scripts/generate_input.js --tx-file captured_txs.json
node scripts/3_generate_proof.js`}
              </pre>

              <div style={{ ...s.row, marginTop: 12 }}>
                <button
                  style={{ ...s.btn, ...s.btnPrimary }}
                  onClick={() => downloadJson(rollupExport, "captured_txs.json")}
                >
                  📥 Download captured_txs.json
                </button>
                <button
                  style={{ ...s.btn, ...s.btnSecondary }}
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(rollupExport, null, 2));
                    log("Copied to clipboard!");
                  }}
                >
                  📋 Copy to Clipboard
                </button>
              </div>

              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: "pointer", color: "#8b949e", fontSize: 13 }}>
                  View raw JSON
                </summary>
                <textarea
                  readOnly
                  value={JSON.stringify(rollupExport, null, 2)}
                  style={{ ...s.log, width: "100%", minHeight: 160, resize: "vertical", marginTop: 8, boxSizing: "border-box" }}
                />
              </details>
            </div>
          )}
        </div>
      )}

      {/* ======== ACTIVITY LOG ======== */}
      <div style={s.card}>
        <h2 style={s.h2}>📋 Activity Log</h2>
        <div style={s.log}>
          {logs.length === 0
            ? "Waiting for activity..."
            : logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
        {logs.length > 0 && (
          <button style={{ ...s.btn, ...s.btnSecondary, marginTop: 8 }} onClick={() => setLogs([])}>
            Clear Logs
          </button>
        )}
      </div>
    </div>
  );
}
