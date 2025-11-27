const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const { getConnection }  = require("../db/connection");

/* ============================================================
   GET ALL LOANS  
   Uses VIEW: vw_loans_summary
============================================================ */
router.get("/", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `
      SELECT 
        loan_id,
        book_id,
        patron_id,
        loan_date,
        due_date
      FROM vw_loans_summary
      ORDER BY loan_id
      `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({ success: true, data: result.rows });

  } catch (err) {
    console.error("Error fetching loans:", err);
    res.status(500).json({ success: false, error: "Failed to fetch loans" });
  } finally {
    if (conn) await conn.close();
  }
});


/* ============================================================
   LOAN A BOOK  
   Uses PROCEDURE: loan_book_sp
   Automatically triggers:
     - trg_set_default_due_date (sets 14-day due date)
============================================================ */
router.post("/", async (req, res) => {
  const { copy_id, member_id, due_date } = req.body;

  let conn;
  try {
    conn = await getConnection();

    await conn.execute(
      `
      BEGIN
        loan_book_sp(
          p_copy_id   => :copy_id,
          p_member_id => :member_id,
          p_due_date  => TO_DATE(:due_date, 'YYYY-MM-DD')
        );
      END;
      `,
      { copy_id, member_id, due_date }
    );

    res.json({ success: true, message: "Book loaned successfully" });

  } catch (err) {
    console.error("Error loaning book:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to loan book" });
  } finally {
    if (conn) await conn.close();
  }
});


/* ============================================================
   RETURN A BOOK  
   Uses PROCEDURE: sp_return_book
   Automatically triggers:
     - trg_calculate_fine_on_return (calculates fines if late)
============================================================ */
router.put("/:loan_id/return", async (req, res) => {
  const loan_id = req.params.loan_id;
  const { return_date } = req.body; // optional

  let conn;
  try {
    conn = await getConnection();

    await conn.execute(
      `
      BEGIN
        sp_return_book(
          p_loan_id     => :loan_id,
          p_return_date => :return_date
        );
      END;
      `,
      { loan_id, return_date }
    );

    res.json({ success: true, message: "Book returned successfully" });

  } catch (err) {
    console.error("Error returning book:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to return book" });
  } finally {
    if (conn) await conn.close();
  }
});


/* ============================================================
   APPLY OVERDUE FINES (Manual run)  
   Uses PROCEDURE: sp_apply_overdue_fines
   Usually NOT needed because trigger auto-calculates,
   but DB developer created it so we include it.
============================================================ */
router.post("/apply-fines", async (req, res) => {
  const fine_per_day = req.body.fine_per_day || 0.50; // default 0.50/day

  let conn;
  try {
    conn = await getConnection();

    await conn.execute(
      `
      BEGIN
        sp_apply_overdue_fines(:fine_per_day);
      END;
      `,
      { fine_per_day }
    );

    res.json({ success: true, message: "Overdue fines applied successfully" });

  } catch (err) {
    console.error("Error applying fines:", err);
    res.status(500).json({ success: false, error: "Failed to apply fines" });
  } finally {
    if (conn) await conn.close();
  }
});


module.exports = router;
