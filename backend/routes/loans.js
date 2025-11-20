const { Router } = require("express");
const { getConnection } = require("../db/connection");
const oracledb = require("oracledb");

const router = Router();

/* =========================================================================
   GET /api/loans
   Fetch ALL loans (Orders + OrderDetails)
   ========================================================================= */
router.get("/", async (req, res) => {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(`
      SELECT 
        o.order_id,
        o.cust_id,
        o.order_date,
        o.due_date,
        d.book_id,
        d.quantity,
        d.unit_price,
        d.total,
        d.return_date,
        d.fine,
        d.fine_status
      FROM BK_ORDERS o
      JOIN BK_ORDERDETAILS d ON o.order_id = d.order_id
      ORDER BY o.order_id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching loans:", err);
    res.status(500).json({ error: "Failed to fetch loans" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

/* =========================================================================
   GET /api/loans/active
   Fetch only active loans (return_date IS NULL)
   ========================================================================= */
router.get("/active", async (req, res) => {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(`
      SELECT 
        o.order_id,
        o.cust_id,
        o.order_date,
        o.due_date,
        d.book_id,
        d.quantity,
        d.return_date
      FROM BK_ORDERS o
      JOIN BK_ORDERDETAILS d ON o.order_id = d.order_id
      WHERE d.return_date IS NULL
      ORDER BY o.order_id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching active loans:", err);
    res.status(500).json({ error: "Failed to fetch active loans" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

/* =========================================================================
   GET /api/loans/overdue
   Fetch overdue loans (due_date < today AND return_date IS NULL)
   ========================================================================= */
router.get("/overdue", async (req, res) => {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(`
      SELECT 
        o.order_id,
        o.cust_id,
        d.book_id,
        o.due_date,
        d.return_date,
        d.fine,
        d.fine_status
      FROM BK_ORDERS o
      JOIN BK_ORDERDETAILS d ON o.order_id = d.order_id
      WHERE d.return_date IS NULL
        AND o.due_date < SYSDATE
      ORDER BY o.order_id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching overdue loans:", err);
    res.status(500).json({ error: "Failed to fetch overdue loans" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

/* =========================================================================
   POST /api/loans
   LOAN A BOOK  
   This calls the REAL stored procedure:
   SP_PLACE_NEW_ORDER
   Parameters expected from frontend:
      first_name, last_name, email, book_title, quantity
   ========================================================================= */
router.post("/", async (req, res) => {
  let conn;

  const {
    first_name,
    last_name,
    email,
    book_title,
    quantity
  } = req.body;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `
      BEGIN
        SP_PLACE_NEW_ORDER(
          p_first_name => :fn,
          p_last_name  => :ln,
          p_email      => :em,
          p_book_title => :bt,
          p_quantity   => :qty,
          p_order_id   => :oid
        );
      END;
      `,
      {
        fn: first_name,
        ln: last_name,
        em: email,
        bt: book_title,
        qty: quantity,
        oid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    res.json({
      message: "Loan placed successfully via SP_PLACE_NEW_ORDER",
      order_id: result.outBinds.oid
    });

  } catch (err) {
    console.error("Error creating loan:", err);
    res.status(500).json({ error: "Failed to place loan" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

/* =========================================================================
   POST /api/loans/:order_id/return
   RETURN A BOOK  
   No stored procedure exists → so we update RETURN_DATE directly
   ========================================================================= */
router.post("/:id/return", async (req, res) => {
  let conn;
  const orderId = req.params.id;

  try {
    conn = await getConnection();

    // update return_date (Triggers will auto calc fine)
    await conn.execute(
      `
      UPDATE BK_ORDERDETAILS
      SET return_date = SYSDATE
      WHERE order_id = :oid
      `,
      { oid: orderId }
    );

    await conn.commit();

    res.json({ message: "Book returned successfully" });

  } catch (err) {
    console.error("Error returning book:", err);
    res.status(500).json({ error: "Failed to return book" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

module.exports = router;
