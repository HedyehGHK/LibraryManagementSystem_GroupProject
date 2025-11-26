const express = require("express");
const router = express.Router();
const { getConnection } = require("../db/connection");
const oracledb = require("oracledb");

/* ====================================================
   GET ALL REGISTERED MEMBERS (vw_registered_members)
==================================================== */
router.get("/", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `
      SELECT *
      FROM vw_registered_members
      ORDER BY patron_id
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({ success: true, data: result.rows });

  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ success: false, error: "Failed to fetch members" });
  } finally {
    if (conn) await conn.close();
  }
});


/* ====================================================
   REGISTER NEW MEMBER (add_patron_sp)
==================================================== */
router.post("/", async (req, res) => {
  const { fname, lname, phone, email, address } = req.body;
  let conn;

  try {
    conn = await getConnection();

    await conn.execute(
      `
      BEGIN
        add_patron_sp(:fname, :lname, :phone, :email, :address);
      END;
      `,
      { fname, lname, phone, email, address }
    );

    res.json({ success: true, message: "Member registered successfully" });

  } catch (err) {
    console.error("Error registering member:", err);
    res.status(500).json({ success: false, error: "Failed to register member" });
  } finally {
    if (conn) await conn.close();
  }
});


/* ====================================================
   UPDATE MEMBER INFO (sp_update_member)
==================================================== */
router.put("/:id", async (req, res) => {
  const { fname, lname, phone, email, address } = req.body;
  let conn;

  try {
    conn = await getConnection();

    await conn.execute(
      `
      BEGIN
        sp_update_member(
          p_patron_id => :id,
          p_fname     => :fname,
          p_lname     => :lname,
          p_phone     => :phone,
          p_email     => :email,
          p_address   => :address
        );
      END;
      `,
      {
        id: req.params.id,
        fname,
        lname,
        phone,
        email,
        address
      }
    );

    res.json({ success: true, message: "Member updated successfully" });

  } catch (err) {
    console.error("Error updating member:", err);
    res.status(500).json({ success: false, error: "Failed to update member" });
  } finally {
    if (conn) await conn.close();
  }
});


module.exports = router;
