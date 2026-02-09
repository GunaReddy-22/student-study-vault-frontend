import { useEffect, useState } from "react";
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

  /* =========================
     FETCH WALLET DATA
  ========================= */
  const fetchWallet = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        api.get("/wallet"),
        api.get("/wallet/transactions"),
      ]);

      setBalance(walletRes.data.balance);
      setTransactions(txRes.data);
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
    if (!amount || Number(amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }

    try {
      // 1️⃣ Create Razorpay order
      const { data } = await api.post("/wallet/create-order", {
        amount: Number(amount),
      });

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "Student Study Vault",
        description: "Wallet Top-up",
        order_id: data.orderId,

        // ✅ Payment success handler
        handler: async function (response) {
          try {
            await api.post("/wallet/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },{headers: {
          "Content-Type": "application/json",
        },});

            alert("✅ Payment successful & wallet updated");
            setAmount("");
            fetchWallet();
          } catch (err) {
            console.error(err);
            alert("❌ Payment verification failed");
          }
        },

        theme: {
          color: "#4f46e5",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error(err);
      alert("❌ Payment initiation failed");
    }
  };

  /* =========================
     WITHDRAW WALLET
  ========================= */
  const handleWithdraw = async () => {
    /*if (!withdrawAmount || Number(withdrawAmount) < 100) {
      alert("Minimum withdrawal is ₹100");
      return;
    }*/

    if (!withdrawPassword) {
      alert("Enter your login password");
      return;
    }

    if (!upiId) {
      alert("Enter your UPI ID");
      return;
    }

    try {
      const res = await api.post("/wallet/withdraw", {
        amount: Number(withdrawAmount),
        password: withdrawPassword,
        upiId,
      });

      alert("✅ Withdrawal request submitted");
      setWithdrawAmount("");
      setWithdrawPassword("");
      setUpiId("");
      setBalance(res.data.balance);
      fetchWallet();
    } catch (err) {
      alert(err.response?.data?.message || "Withdrawal failed");
    }
  };

  if (loading) {
    return <div className="wallet-page">Loading wallet...</div>;
  }

  return (
    <div className="wallet-page">
      <h2>💰 My Wallet</h2>

      {/* ================= BALANCE ================= */}
      <div className="wallet-balance-card">
        <div className="balance-label">Current Balance</div>
        <div className="balance-amount">₹ {balance}</div>

        {/* ADD MONEY */}
        <div className="add-money">
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={handleRazorpayPayment}>
            Add Money
          </button>
        </div>
      </div>

      {/* ================= WITHDRAW ================= */}
      <div className="wallet-withdraw-card">
        <h3>🏧 Withdraw Money</h3>

        <input
          type="number"
          placeholder="Amount (min ₹100)"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
        />

        <input
          type="password"
          placeholder="Login password"
          value={withdrawPassword}
          onChange={(e) => setWithdrawPassword(e.target.value)}
        />

        <input
          type="text"
          placeholder="Your UPI ID"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
        />

        <button onClick={handleWithdraw}>
          Withdraw
        </button>
      </div>

      {/* ================= TRANSACTIONS ================= */}
      <div className="wallet-transactions">
        <h3>🧾 Transactions</h3>

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

                <div className="tx-right">
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