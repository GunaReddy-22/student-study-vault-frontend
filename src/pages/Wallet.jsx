import { useState, useEffect } from "react";
import api from "../services/api";
import "./Wallet.css";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Top-up
  const [amount, setAmount] = useState("");

  // Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [upiId, setUpiId] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [myWithdrawals, setMyWithdrawals] = useState([]);

  /* =========================
     FETCH WALLET DATA
  ========================= */
  const fetchWallet = async () => {
    try {
      const [walletRes, txRes, withRes] = await Promise.all([
        api.get("/wallet"),
        api.get("/wallet/transactions"),
        api.get("/wallet/my-withdrawals").catch(() => ({ data: { requests: [] } })),
      ]);

      setBalance(walletRes.data.balance);
      setTransactions(txRes.data || []);
      if (withRes?.data?.requests) {
        setMyWithdrawals(withRes.data.requests);
      }
    } catch (err) {
      console.error("Wallet fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  /* =========================
     RAZORPAY PAYMENT
  ========================= */
  const handleRazorpayPayment = async () => {
    if (!amount || Number(amount) < 10) {
      alert("Minimum add amount is ₹10");
      return;
    }

    try {
      const { data } = await api.post("/wallet/create-order", {
        amount: Number(amount),
      });

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "Student Study Vault",
        description: "Wallet Recharge",
        order_id: data.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await api.post("/wallet/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            alert("🎉 Wallet recharge successful!");
            setBalance(verifyRes.data.balance);
            setAmount("");
            fetchWallet();
          } catch (err) {
            console.error(err);
            alert("❌ Payment verification failed");
          }
        },
        theme: { color: "#4f46e5" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error(err);
      alert("❌ Payment initiation failed");
    }
  };

  /* =========================
     WITHDRAW WALLET TO UPI
  ========================= */
  const handleWithdraw = async (e) => {
    e?.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt < 10) {
      alert("Minimum withdrawal amount is ₹10");
      return;
    }

    if (amt > balance) {
      alert(`Insufficient funds. Your available balance is ₹${balance}`);
      return;
    }

    if (!withdrawPassword) {
      alert("Enter your login password for authorization");
      return;
    }

    if (!upiId || !upiId.trim()) {
      alert("Enter a valid UPI ID (e.g., student@okaxis or 9876543210@paytm)");
      return;
    }

    try {
      setWithdrawSubmitting(true);
      const res = await api.post("/wallet/withdraw", {
        amount: amt,
        password: withdrawPassword,
        upiId: upiId.trim(),
        method: "UPI",
      });

      alert(res.data.message || "✅ Withdrawal request submitted! Developer admin will process payment to your UPI.");
      setWithdrawAmount("");
      setWithdrawPassword("");
      setUpiId("");
      fetchWallet();
    } catch (err) {
      alert(err.response?.data?.message || "Withdrawal failed");
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  if (loading) {
    return <div className="wallet-page"><div className="wallet-loading">Loading wallet & payout ledger...</div></div>;
  }

  return (
    <div className="wallet-page">
      <div className="wallet-header-strip">
        <div>
          <h2>💰 My Wallet & Payout Center</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: "4px 0 0" }}>
            Manage your study coins, add balance, or withdraw earnings directly to your UPI ID.
          </p>
        </div>
      </div>

      <div className="wallet-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", margin: "24px 0" }}>
        {/* ================= BALANCE & TOP UP ================= */}
        <div className="wallet-balance-card">
          <div className="balance-label">Available Balance</div>
          <div className="balance-amount">₹ {balance}</div>

          <div className="add-money">
            <input
              type="number"
              placeholder="Enter amount (min ₹10)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={handleRazorpayPayment}>
              ➕ Add Money
            </button>
          </div>
        </div>

        {/* ================= WITHDRAW TO UPI ================= */}
        <div className="wallet-withdraw-card" style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", padding: "22px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "#38bdf8" }}>🏧 Withdraw to UPI ID</h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "14px" }}>
            Submit payout request. Once approved by developer, the amount is disbursed to your UPI.
          </p>

          <form onSubmit={handleWithdraw} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input
              type="number"
              min="10"
              max={balance}
              placeholder="Amount to withdraw (min ₹10)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              required
              style={{ padding: "10px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", outline: "none" }}
            />

            <input
              type="text"
              placeholder="Your UPI ID (e.g. mobile@paytm, user@oksbi)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
              style={{ padding: "10px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", outline: "none" }}
            />

            <input
              type="password"
              placeholder="Confirm Login Password"
              value={withdrawPassword}
              onChange={(e) => setWithdrawPassword(e.target.value)}
              required
              style={{ padding: "10px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", outline: "none" }}
            />

            <button
              type="submit"
              disabled={withdrawSubmitting || balance < 10}
              style={{
                padding: "12px",
                background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
                fontWeight: "700",
                cursor: "pointer",
                marginTop: "4px",
              }}
            >
              {withdrawSubmitting ? "Submitting Request..." : "Request Payout to UPI"}
            </button>
          </form>
        </div>
      </div>

      {/* ================= WITHDRAWAL REQUESTS TRACKER ================= */}
      {myWithdrawals.length > 0 && (
        <div className="wallet-transactions" style={{ marginBottom: "28px" }}>
          <h3 style={{ marginBottom: "12px" }}>📋 My Payout & Withdrawal Requests</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {myWithdrawals.map((req) => (
              <li
                key={req._id}
                className="tx"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px",
                  background: "rgba(15, 23, 42, 0.6)",
                  borderRadius: "12px",
                  marginBottom: "10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "18px", fontWeight: "800", color: "#f8fafc" }}>₹{req.amount}</span>
                    <span style={{ fontSize: "12px", color: "#38bdf8", background: "rgba(56, 189, 248, 0.1)", padding: "3px 8px", borderRadius: "6px" }}>
                      UPI: {req.upiId}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginTop: "4px" }}>
                    Requested on: {new Date(req.createdAt).toLocaleString()}
                  </span>
                  {req.payoutRef && (
                    <div style={{ fontSize: "12px", color: "#10b981", marginTop: "6px", fontWeight: "600" }}>
                      ✔ Paid via UPI (UTR Reference: {req.payoutRef})
                    </div>
                  )}
                  {req.rejectionReason && (
                    <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px" }}>
                      ✖ Rejected: {req.rejectionReason} (Amount has been refunded to your wallet)
                    </div>
                  )}
                </div>

                <div>
                  <span
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "700",
                      background:
                        req.status === "APPROVED"
                          ? "rgba(16, 185, 129, 0.2)"
                          : req.status === "REJECTED"
                          ? "rgba(239, 68, 68, 0.2)"
                          : "rgba(245, 158, 11, 0.2)",
                      color:
                        req.status === "APPROVED"
                          ? "#34d399"
                          : req.status === "REJECTED"
                          ? "#f87171"
                          : "#fbbf24",
                      border: `1px solid ${
                        req.status === "APPROVED"
                          ? "rgba(16, 185, 129, 0.4)"
                          : req.status === "REJECTED"
                          ? "rgba(239, 68, 68, 0.4)"
                          : "rgba(245, 158, 11, 0.4)"
                      }`,
                    }}
                  >
                    {req.status === "APPROVED"
                      ? "● Disbursed to UPI"
                      : req.status === "REJECTED"
                      ? "✖ Rejected & Refunded"
                      : "⏳ Pending Dev Approval"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ================= TRANSACTIONS HISTORY ================= */}
      <div className="wallet-transactions">
        <h3 style={{ marginBottom: "12px" }}>🧾 Wallet Activity Ledger</h3>

        {transactions.length === 0 ? (
          <p className="empty">No transactions yet</p>
        ) : (
          <ul>
            {transactions.map((tx) => (
              <li
                key={tx._id}
                className={`tx ${tx.type === "CREDIT" ? "credit" : "debit"}`}
              >
                <div className="tx-left">
                  <strong>{tx.reason}</strong>
                  <span>
                    {new Date(tx.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="tx-right" style={{ fontSize: "16px", fontWeight: "700" }}>
                  {tx.type === "CREDIT" ? "+" : "-"}₹{tx.amount}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}