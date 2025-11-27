const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const { getConnection } = require("../db/connection");

/* ============================================================
   GET ALL BOOKS  
   Uses VIEW: v_books_availability
============================================================ */
router.get("/", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `
      SELECT 
  book_id,
  title,
  author,
  publisher_name,
  total_copies,
  available_copies,
  loaned_copies,
  lost_copies
FROM v_books_availability
ORDER BY book_id

      `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ success: false, error: "Failed to fetch books" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   GET DISTINCT AUTHORS (for Dropdown filter)
   Uses TABLE: lms_books
============================================================ */
router.get("/authors", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT DISTINCT author FROM lms_books ORDER BY author`,
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching authors:", err);
    res.status(500).json({ success: false, error: "Failed to fetch authors" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   SEARCH BOOKS BY AUTHOR  
   Uses VIEW: v_books_availability
============================================================ */
router.get("/search/author/:author", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const author = req.params.author;

    const result = await conn.execute(
      `
      SELECT *
      FROM v_books_availability
      WHERE LOWER(author) LIKE LOWER(:author)
      `,
      { author: `%${author}%` },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error searching books by author:", err);
    res.status(500).json({ success: false, error: "Failed to search" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   SEARCH BOOKS BY TITLE  
   Uses VIEW: v_books_availability
============================================================ */
router.get("/search/title/:title", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const title = req.params.title;

    const result = await conn.execute(
      `
      SELECT *
      FROM v_books_availability
      WHERE LOWER(title) LIKE LOWER(:title)
      `,
      { title: `%${title}%` },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error searching books by title:", err);
    res.status(500).json({ success: false, error: "Failed to search" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   GET BOOK BY ID  
   Uses VIEW: v_books_availability
============================================================ */
router.get("/:id", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { id } = req.params;

    const result = await conn.execute(
      `
      SELECT *
      FROM v_books_availability
      WHERE book_id = :id
      `,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    if (result.rows.length === 0)
      return res.json({ success: false, error: "Book not found" });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error fetching book:", err);
    res.status(500).json({ success: false, error: "Failed to fetch book" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   ADD BOOK  
   Uses PROCEDURE: sp_add_book
============================================================ */
router.post("/", async (req, res) => {
  const { title, author, publisher_id, isbn, pub_year } = req.body;

  let conn;
  try {
    conn = await getConnection();

    await conn.execute(
      `
      BEGIN
        sp_add_book(:title, :author, :publisher_id, :isbn, :pub_year);
      END;
      `,
      { title, author, publisher_id, isbn, pub_year },
    );

    res.json({ success: true, message: "Book added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to add book" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   UPDATE BOOK  
   Uses PROCEDURE: sp_update_book
============================================================ */
router.put("/:id", async (req, res) => {
  const book_id = req.params.id;
  const { title, author, pub_year } = req.body;

  let conn;
  try {
    conn = await getConnection();

    await conn.execute(
      `
      BEGIN
        sp_update_book(
          p_book_id => :book_id,
          p_title   => :title,
          p_author  => :author,
          p_pub_year=> :pub_year
        );
      END;
      `,
      { book_id, title, author, pub_year },
    );

    res.json({ success: true, message: "Book updated successfully" });
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).json({ success: false, error: "Failed to update book" });
  } finally {
    if (conn) await conn.close();
  }
});

/* ============================================================
   DELETE BOOK  
   Uses PROCEDURE: sp_delete_book
============================================================ */
router.delete("/:id", async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    await conn.execute(
      `
      BEGIN
        sp_delete_book(:id);
      END;
      `,
      { id: req.params.id },
    );

    res.json({ success: true, message: "Book deleted successfully" });
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).json({ success: false, error: "Failed to delete book" });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
