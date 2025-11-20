const { Router } = require("express");
const { getConnection } = require("../db/connection");
const oracledb = require("oracledb");

const router = Router();

/* ----------------------------------------------------
   GET ALL BOOKS 
-----------------------------------------------------*/
router.get("/", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(`
      SELECT 
        book_id, title, author_id, pub_id, category_id,
        lang_id, value, total_copies, available_copies
      FROM BK_BOOKS
      ORDER BY book_id
    `);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch books" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});


/* ----------------------------------------------------
   SEARCH BOOKS 
-----------------------------------------------------*/
router.get("/search", async (req, res) => {
  let conn;
  const { title } = req.query;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `
      SELECT *
      FROM BK_BOOKS
      WHERE LOWER(title) LIKE '%' || LOWER(:title) || '%'
    `,
      { title }
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: "Failed to search books" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});


/* ----------------------------------------------------
   ADD NEW BOOK  (CALL SP_ADD_NEW_BOOK)
-----------------------------------------------------*/
router.post("/", async (req, res) => {
  const {
    title,
    author_name,
    publisher_name,
    category_name,
    language_name,
    value,
    total_copies,
    available_copies
  } = req.body;

  let conn;

  try {
    conn = await getConnection();

    const binds = {
      p_title: title,
      p_author_name: author_name,
      p_publisher_name: publisher_name,
      p_category_name: category_name,
      p_language_name: language_name,
      p_value: value,
      p_total_copies: total_copies,
      p_available_copies: available_copies,
      p_book_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    await conn.execute(
      `
      BEGIN
        SP_ADD_NEW_BOOK(
          :p_title,
          :p_author_name,
          :p_publisher_name,
          :p_category_name,
          :p_language_name,
          :p_value,
          :p_total_copies,
          :p_available_copies,
          :p_book_id
        );
      END;
      `,
      binds
    );

    res.json({
      message: "Book added successfully",
      new_book_id: binds.p_book_id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add book" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});


/* ----------------------------------------------------
   UPDATE BOOK VALUE (ONLY PRICE)
   CALL: PR_UPDATE_BOOK_VALUE(title, new_value)
-----------------------------------------------------*/
router.put("/value", async (req, res) => {
  const { title, value } = req.body;

  let conn;

  try {
    conn = await getConnection();

    await conn.execute(
      `
      BEGIN
        PR_UPDATE_BOOK_VALUE(:title, :value);
      END;
      `,
      { title, value }
    );

    res.json({ message: "Book price updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update price" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});


/* ----------------------------------------------------
   DELETE BOOK (direct SQL)
-----------------------------------------------------*/
router.delete("/:id", async (req, res) => {
  let conn;
  const id = req.params.id;

  try {
    conn = await getConnection();

    await conn.execute(
      `DELETE FROM BK_BOOKS WHERE book_id = :id`,
      { id }
    );

    res.json({ message: "Book deleted" });

  } catch (err) {
    res.status(500).json({ error: "Failed to delete book" });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

module.exports = router;
