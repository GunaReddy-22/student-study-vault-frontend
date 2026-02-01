import { useEffect, useState } from "react";
import api from "../services/api";
import "./Wallet.css";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");

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
     ADD DEMO MONEY
  ========================= */
  const addDemoMoney = async () => {
    if (!amount || Number(amount) <= 0) return;

    try {
      const res = await api.post("/wallet/add-demo", {
        amount: Number(amount),
      });

      setBalance(res.data.balance);
      setAmount("");
      fetchWallet();
    } catch (err) {
      alert("Failed to add demo money");
    }
  };

  const handleRazorpayPayment = async () => {
  if (!amount || Number(amount) <= 0) {
    alert("Enter valid amount");
    return;
  }

  try {
    // 1️⃣ Create order
    const { data } = await api.post("/wallet/create-order", {
      amount: Number(amount),
    });

    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: "StudyVault",
      description: "Wallet Top-up",
      order_id: data.orderId,

      handler: async function (response) {
        try {
          // 2️⃣ Verify payment
          const verifyRes = await api.post("/wallet/verify-payment", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            amount: Number(amount),
          });

          alert("Payment successful 🎉");
          setAmount("");
          fetchWallet();
        } catch (err) {
          alert("Payment verification failed");
        }
      },

      theme: {
        color: "#4f46e5",
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (err) {
    alert("Payment initiation failed");
  }
};

  if (loading) {
    return <div className="wallet-page">Loading wallet...</div>;
  }

  return (
    <div className="wallet-page">
      <h2>💰 My Wallet</h2>

      {/* BALANCE CARD */}
      <div className="wallet-balance-card">
        <div className="balance-label">Current Balance</div>
        <div className="balance-amount">₹ {balance}</div>

        <div className="add-money">
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={handleRazorpayPayment}>Add Money</button>
        </div>
      </div>

      {/* TRANSACTIONS */}
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