const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const { getConnection } = require("../db/connection");

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Reports API is running",
    available_routes: [
      "/api/reports/overdue",
      "/api/reports/unpaid-fines",
      "/api/reports/top5",
      "/api/reports/most-borrowed/:year",
      "/api/reports/book-copy-status/:book_id",
    ],
  });
});

/* ============================================================
   OVERDUE BOOKS REPORT  
   Uses VIEW: vw_overdue_books
============================================================ */
router.get("/overdue", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `
      SELECT *
      FROM vw_overdue_books
      ORDER BY overdue_days DESC
      `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching overdue books:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch overdue books" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   OVERDUE LOANS WITH FINES  
   Uses VIEW: v_overdue_loans_with_fines
============================================================ */
router.get("/overdue-with-fines", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT * FROM v_overdue_loans_with_fines`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching overdue/fines:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch overdue fines" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   UNPAID FINES ONLY  
   Uses VIEW: v_overdue_loans_with_fines
============================================================ */
router.get("/unpaid-fines", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `
      SELECT *
      FROM v_overdue_loans_with_fines
      WHERE paid_flag = 'N'
      `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching unpaid fines:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch unpaid fines" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   TOP 5 MOST LOANED  
   Uses VIEW: lms_top5_most_loaned_books
============================================================ */
router.get("/top5", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT * FROM lms_top5_most_loaned_books`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching top5:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch top5 books" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   MOST BORROWED BOOKS  
   Uses VIEW: lms_most_borrowed_books
============================================================ */
router.get("/most-borrowed", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT * FROM VW_MOST_BORROWED_BOOKS ORDER BY times_borrowed DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching most borrowed:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch most borrowed books",
    });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   BOOK COPY STATUS  
   Uses VIEW: v_book_copy_status
============================================================ */
router.get("/book-copy-status/:book_id", async (req, res) => {
  const book_id = req.params.book_id;

  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `
      SELECT *
      FROM v_book_copy_status
      WHERE book_id = :book_id
      `,
      { book_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching copy status:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch copy status" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   PAY A FINE  
   Uses PROCEDURE: sp_pay_fine
============================================================ */
router.put("/pay-fine/:loan_id", async (req, res) => {
  const loan_id = req.params.loan_id;

  let conn;
  try {
    conn = await getConnection();

    await conn.execute(
      `
      BEGIN
        sp_pay_fine(:loan_id);
      END;
      `,
      { loan_id },
      { autoCommit: true },
    );

    res.json({ success: true, message: "Fine marked as PAID" });
  } catch (err) {
    console.error("Error paying fine:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to update fine status" });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
