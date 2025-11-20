const { Router } = require("express");
const { getConnection } = require("../db/connection");
const oracledb = require("oracledb");

const router = Router();

/* ============================================================
   GET /api/reports/most-borrowed/:year
   Calls procedure SP_MOST_BORROWED_BY_YEAR(p_year)
   and returns the result as JSON
   ------------------------------------------------------------
   Required: p_year (NUMBER)
   ============================================================ */
router.get("/most-borrowed/:year", async (req, res) => {
  let conn;

  const year = Number(req.params.year);

  if (isNaN(year)) {
    return res.status(400).json({ error: "Year must be a number" });
  }

  try {
    conn = await getConnection();

    /* 
       We will use DBMS_OUTPUT to capture what the stored
       procedure prints, then return it as JSON to frontend.
    */

    // Enable DBMS_OUTPUT buffer
    await conn.execute(`BEGIN DBMS_OUTPUT.ENABLE(NULL); END;`);

    // Call stored procedure
    await conn.execute(
      `BEGIN SP_MOST_BORROWED_BY_YEAR(:yr); END;`,
      { yr: year }
    );

    // Read DBMS_OUTPUT content
    let outputLines = [];
    let done = false;

    while (!done) {
      const result = await conn.execute(
        `BEGIN DBMS_OUTPUT.GET_LINE(:line, :status); END;`,
        {
          line: { type: oracledb.STRING, dir: oracledb.BIND_OUT },
          status: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        }
      );

      if (result.outBinds.status !== 0) {
        done = true; 
      } else {
        outputLines.push(result.outBinds.line);
      }
    }

    res.json({
      year,
      message: "Report generated successfully",
      result: outputLines
    });

  } catch (err) {
    console.error("Error running report:", err);
    res.status(500).json({ error: "Failed to run report" });

  } finally {
    if (conn) {
      try { await conn.close(); } catch {}
    }
  }
});

module.exports = router;
