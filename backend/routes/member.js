const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const { getConnection } = require("../db/connection");

/* ============================================================
   GET ALL MEMBERS  
   Uses VIEW: vw_registered_members
============================================================ */
router.get("/", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `
      SELECT 
        member_id,
        full_name,
        member_type,
        join_date,
        email
      FROM vw_registered_members
      ORDER BY full_name
      `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ success: false, error: "Failed to fetch members" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   ADD NEW MEMBER  
   Uses PROCEDURE: add_patron_sp
============================================================ */
router.post("/", async (req, res) => {
  const { name, member_type, email } = req.body;

  let conn;
  try {
    conn = await getConnection();

    await conn.execute(
      `
      BEGIN
        add_patron_sp(:name, :member_type, :email);
      END;
      `,
      { name, member_type, email },
    );

    res.json({ success: true, message: "Member added successfully" });
  } catch (err) {
    console.error("Error adding member:", err);
    res.status(500).json({ success: false, error: "Failed to add member" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   UPDATE MEMBER (Full update)  
   Uses PROCEDURE: sp_update_member
============================================================ */
router.put("/:id", async (req, res) => {
  const member_id = req.params.id;
  const { name, member_type, email } = req.body;

  let conn;
  try {
    conn = await getConnection();

    await conn.execute(
      `
      BEGIN
        sp_update_member(
          p_member_id   => :member_id,
          p_name        => :name,
          p_member_type => :member_type,
          p_email       => :email
        );
      END;
      `,
      { member_id, name, member_type, email },
    );

    res.json({ success: true, message: "Member updated successfully" });
  } catch (err) {
    console.error("Error updating member:", err);
    res.status(500).json({ success: false, error: "Failed to update member" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   UPDATE MEMBER EMAIL ONLY  
   Uses PROCEDURE: sp_update_member_email
============================================================ */
router.put("/:id/email", async (req, res) => {
  const member_id = req.params.id;
  const { email } = req.body;

  let conn;
  try {
    conn = await getConnection();

    await conn.execute(
      `
      BEGIN
        sp_update_member_email(:member_id, :email);
      END;
      `,
      { member_id, email },
    );

    res.json({ success: true, message: "Email updated successfully" });
  } catch (err) {
    console.error("Error updating email:", err);
    res.status(500).json({ success: false, error: "Failed to update email" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   GET MEMBER LOAN COUNT  
   Uses FUNCTION: fn_total_loans(p_member_id)
============================================================ */
router.get("/:id/loan-count", async (req, res) => {
  const member_id = req.params.id;

  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `
      SELECT fn_total_loans(:member_id) AS total_loans
      FROM dual
      `,
      { member_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error fetching loan count:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch loan count" });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
