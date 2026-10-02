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

      <div className="wallet-cards-grid">
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
        <div className="wallet-withdraw-card">
          <h3 className="withdraw-title">🏧 Withdraw to UPI ID</h3>
          <p className="withdraw-desc">
            Submit payout request. Once approved by developer, the amount is disbursed to your UPI.
          </p>

          <form onSubmit={handleWithdraw} className="withdraw-form">
            <input
              type="number"
              min="10"
              max={balance}
              placeholder="Amount to withdraw (min ₹10)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Your UPI ID (e.g. mobile@paytm, user@oksbi)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Confirm Login Password"
              value={withdrawPassword}
              onChange={(e) => setWithdrawPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={withdrawSubmitting || balance < 10}
              className="withdraw-submit-btn"
            >
              {withdrawSubmitting ? "Submitting Request..." : "Request Payout to UPI"}
            </button>
          </form>
        </div>
      </div>

      {/* ================= WITHDRAWAL REQUESTS TRACKER ================= */}
      {myWithdrawals.length > 0 && (
        <div className="wallet-transactions payout-tracker-section">
          <h3 style={{ marginBottom: "12px" }}>📋 My Payout & Withdrawal Requests</h3>
          <ul className="wallet-payouts-list">
            {myWithdrawals.map((req) => (
              <li key={req._id} className="wallet-payout-card">
                <div className="wallet-payout-header">
                  <div className="wallet-payout-amount-box">
                    <span className="wallet-payout-amount">₹{req.amount}</span>
                    <span className="wallet-payout-upi">UPI: {req.upiId}</span>
                  </div>
                  <span className={`wallet-payout-status ${req.status?.toLowerCase() || "pending"}`}>
                    {req.status === "APPROVED"
                      ? "● Disbursed to UPI"
                      : req.status === "REJECTED"
                      ? "✖ Rejected & Refunded"
                      : "⏳ Pending Dev Approval"}
                  </span>
                </div>

                <div className="wallet-payout-meta">
                  <span>Requested on: {new Date(req.createdAt).toLocaleString()}</span>
                </div>

                {req.payoutRef && (
                  <div className="wallet-payout-ref-box success">
                    ✔ Paid via UPI (UTR Reference: {req.payoutRef})
                  </div>
                )}
                {req.rejectionReason && (
                  <div className="wallet-payout-ref-box error">
                    ✖ Rejected: {req.rejectionReason} (Amount has been refunded to your wallet)
                  </div>
                )}
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