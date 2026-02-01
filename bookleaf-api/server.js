const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ---------------- DATA ---------------- */

const authors = [
  { id: 1, name: "Priya Sharma", email: "priya@email.com" },
  { id: 2, name: "Rahul Verma", email: "rahul@email.com" },
  { id: 3, name: "Anita Desai", email: "anita@email.com" }
];

const books = [
  { id: 1, title: "The Silent River", authorId: 1, royalty: 45 },
  { id: 2, title: "Midnight in Mumbai", authorId: 1, royalty: 60 },
  { id: 3, title: "Code & Coffee", authorId: 2, royalty: 75 },
  { id: 4, title: "Startup Diaries", authorId: 2, royalty: 50 },
  { id: 5, title: "Poetry of Pain", authorId: 2, royalty: 30 },
  { id: 6, title: "Garden of Words", authorId: 3, royalty: 40 }
];

const sales = [
  { bookId: 1, qty: 25 },
  { bookId: 1, qty: 40 },
  { bookId: 2, qty: 15 },
  { bookId: 3, qty: 60 },
  { bookId: 3, qty: 45 },
  { bookId: 4, qty: 30 },
  { bookId: 5, qty: 20 },
  { bookId: 6, qty: 10 }
];

let withdrawals = [];

/* ---------------- HELPERS ---------------- */

function calculateEarnings(authorId) {
  let total = 0;

  for (let sale of sales) {
    const book = books.find(b => b.id === sale.bookId);
    if (book && book.authorId === authorId) {
      total += sale.qty * book.royalty;
    }
  }
  return total;
}

function calculateBalance(authorId) {
  const withdrawn = withdrawals
    .filter(w => w.authorId === authorId)
    .reduce((sum, w) => sum + w.amount, 0);

  return calculateEarnings(authorId) - withdrawn;
}

/* ---------------- ROUTES ---------------- */

// 1️⃣ GET /authors
app.get("/authors", (req, res) => {
  const result = authors.map(a => ({
    id: a.id,
    name: a.name,
    total_earnings: calculateEarnings(a.id),
    current_balance: calculateBalance(a.id)
  }));
  res.json(result);
});

// 2️⃣ GET /authors/:id
app.get("/authors/:id", (req, res) => {
  const id = Number(req.params.id);
  const author = authors.find(a => a.id === id);

  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }

  const authorBooks = books
    .filter(b => b.authorId === id)
    .map(b => {
      const sold = sales
        .filter(s => s.bookId === b.id)
        .reduce((sum, s) => sum + s.qty, 0);

      return {
        id: b.id,
        title: b.title,
        royalty: b.royalty,
        total_sold: sold,
        total_earned: sold * b.royalty
      };
    });

  res.json({
    id: author.id,
    name: author.name,
    email: author.email,
    total_earnings: calculateEarnings(id),
    current_balance: calculateBalance(id),
    books: authorBooks
  });
});

// 3️⃣ GET /authors/:id/sales
app.get("/authors/:id/sales", (req, res) => {
  const id = Number(req.params.id);
  let result = [];

  for (let sale of sales) {
    const book = books.find(b => b.id === sale.bookId);
    if (book && book.authorId === id) {
      result.push({
        book: book.title,
        quantity: sale.qty,
        earned: sale.qty * book.royalty
      });
    }
  }

  res.json(result);
});

// 4️⃣ POST /withdrawals
app.post("/withdrawals", (req, res) => {
  const { author_id, amount } = req.body;

  if (!author_id || amount < 500) {
    return res.status(400).json({ error: "Minimum withdrawal is 500" });
  }

  const balance = calculateBalance(author_id);
  if (amount > balance) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  withdrawals.push({
    id: withdrawals.length + 1,
    authorId: author_id,
    amount,
    date: new Date().toISOString()
  });

  res.json({
    message: "Withdrawal successful",
    remaining_balance: calculateBalance(author_id)
  });
});

// 5️⃣ GET /authors/:id/withdrawals
app.get("/authors/:id/withdrawals", (req, res) => {
  const id = Number(req.params.id);
  res.json(withdrawals.filter(w => w.authorId === id));
});

/* ---------------- START ---------------- */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});