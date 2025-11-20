const { Router } = require("express");
const { getConnection } = require("../db/connection");
const oracledb = require("oracledb");

const router = Router();

/* =====================================================
   GET ALL MEMBERS
   View all patrons from BK_CUSTOMERS
===================================================== */
router.get("/", async (req, res) => {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(`
      SELECT 
        cust_id,
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        province,
        zip,
        join_date
      FROM BK_CUSTOMERS
      ORDER BY cust_id
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ error: "Failed to fetch members" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});


/* =====================================================
   ADD NEW MEMBER  (CALL SP_UPSERT_CUSTOMER)
   - This procedure both INSERTS and UPDATES
===================================================== */
router.post("/", async (req, res) => {
  let conn;

  try {
    conn = await getConnection();

    const {
      first_name,
      last_name,
      email,
      phone,
      address,
      city,
      province,
      zip
    } = req.body;

    // OUT parameter for newly generated customer ID
    let outId = {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER
    };

    await conn.execute(
      `
      BEGIN
        SP_UPSERT_CUSTOMER(
          NULL,     -- p_cust_id NULL → INSERT
          :first_name,
          :last_name,
          :email,
          :phone,
          :address,
          :city,
          :province,
          :zip,
          :new_id
        );
      END;
      `,
      {
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        province,
        zip,
        new_id: outId
      }
    );

    res.json({
      message: "Member registered successfully!",
      new_customer_id: outId.outBinds
    });

  } catch (err) {
    console.error("Error adding member:", err);
    res.status(500).json({ error: "Failed to add member" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});


/* =====================================================
   UPDATE MEMBER  (CALL SP_UPSERT_CUSTOMER AGAIN)
===================================================== */
router.put("/:id", async (req, res) => {
  let conn;

  try {
    conn = await getConnection();

    const cust_id = Number(req.params.id);
    const { address, phone, email } = req.body;

    let outId = {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER
    };

    await conn.execute(
      `
      BEGIN
        SP_UPSERT_CUSTOMER(
          :cust_id,
          NULL,
          NULL,
          :email,
          :phone,
          :address,
          NULL,
          NULL,
          NULL,
          :updated_id
        );
      END;
      `,
      {
        cust_id,
        email,
        phone,
        address,
        updated_id: outId
      }
    );

    res.json({
      message: "Member updated successfully!",
      updated_id: outId.outBinds
    });

  } catch (err) {
    console.error("Error updating member:", err);
    res.status(500).json({ error: "Failed to update member" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});


module.exports = router;
