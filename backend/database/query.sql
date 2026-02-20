--Procedure to modify member's email

CREATE OR REPLACE PROCEDURE sp_update_member_email (
    p_member_id IN lms_members.member_id%TYPE,
    p_email     IN lms_members.email%TYPE
)
AS
BEGIN
    UPDATE lms_members
       SET email = p_email
     WHERE member_id = p_member_id;

    COMMIT;
END;
/

--EXEC sp_update_member_email(5, 'newemail@example.com');


--Function that calculates total loans for a member_id:

CREATE OR REPLACE FUNCTION fn_total_loans (
    p_member_id IN lms_members.member_id%TYPE
) RETURN NUMBER
AS
    v_total NUMBER;
BEGIN
    SELECT COUNT(*)
      INTO v_total
      FROM lms_loans
     WHERE member_id = p_member_id;

    RETURN v_total;
END;
/

--SELECT fn_total_loans(8) AS total_loans FROM dual;


/*Procedure that is checking if due_date < SYSDATE and return_date IS NULL
Then calculates $0.50/day for overdue days and either inserts or updates lms_loan_fines with calculated fines  
*/

CREATE OR REPLACE PROCEDURE sp_apply_overdue_fines (
    p_fine_per_day IN NUMBER DEFAULT 0.50
) AS
  CURSOR cur_overdue IS
    SELECT loan_id, due_date
    FROM lms_loans
    WHERE return_date IS NULL AND due_date < SYSDATE;
  v_overdue_days NUMBER;
  v_fine_amount  NUMBER(6,2);
BEGIN
  FOR rec IN cur_overdue LOOP
    v_overdue_days := TRUNC(SYSDATE) - TRUNC(rec.due_date);
    v_fine_amount := v_overdue_days * p_fine_per_day;

    -- Check if fine already exists
    MERGE INTO lms_loan_fines f
    USING (SELECT rec.loan_id AS loan_id FROM dual) src
    ON (f.loan_id = src.loan_id)
    WHEN MATCHED THEN
      UPDATE SET fine_amount = v_fine_amount, paid_flag = 'N'
    WHEN NOT MATCHED THEN
      INSERT (loan_id, fine_amount, paid_flag)
      VALUES (rec.loan_id, v_fine_amount, 'N');
  END LOOP;
  COMMIT;
END;
/

--EXEC sp_apply_overdue_fines;


--Procedure to turn the paid_flag to 'Y' once a fine was paid (it requires loan_id)

CREATE OR REPLACE PROCEDURE sp_pay_fine (
    p_loan_id IN NUMBER
) AS
BEGIN
  UPDATE lms_loan_fines
  SET paid_flag = 'Y'
  WHERE loan_id = p_loan_id;
  COMMIT;
END;
/

--execute sp_pay_fine(4);


--View that retrieves the overdue loans, name, book, with fines

CREATE OR REPLACE VIEW v_overdue_loans_with_fines AS
SELECT
  l.loan_id,
  m.full_name,
  b.title,
  l.loan_date,
  l.due_date,
  f.fine_amount,
  f.paid_flag
FROM
  lms_loans l
  JOIN lms_members m ON l.member_id = m.member_id
  JOIN lms_book_copies bc ON l.copy_id = bc.copy_id
  JOIN lms_books b ON bc.book_id = b.book_id
  LEFT JOIN lms_loan_fines f ON l.loan_id = f.loan_id
WHERE
  l.return_date IS NULL
  AND l.due_date < SYSDATE;
  
  --select * from V_OVERDUE_LOANS_WITH_FINES;


--Trigger that automatically updates the fine_amount if the return_date is updated and it's overdue

CREATE OR REPLACE TRIGGER trg_apply_fine_on_return
AFTER UPDATE OF return_date ON lms_loans
FOR EACH ROW
DECLARE
  v_overdue_days NUMBER;
  v_fine_amount  NUMBER(6,2);
  v_fine_per_day CONSTANT NUMBER := 0.50;
  v_exists       NUMBER;
BEGIN
  IF :NEW.return_date IS NOT NULL THEN
    -- Check if returned after due date
    IF :NEW.return_date > :OLD.due_date THEN
      v_overdue_days := :NEW.return_date - :OLD.due_date;
      v_fine_amount := v_overdue_days * v_fine_per_day;

      -- Check if fine already exists
      SELECT COUNT(*) INTO v_exists
      FROM lms_loan_fines
      WHERE loan_id = :NEW.loan_id;

      IF v_exists > 0 THEN
        -- Update existing fine
        UPDATE lms_loan_fines
           SET fine_amount = v_fine_amount,
               paid_flag   = 'N'
         WHERE loan_id = :NEW.loan_id;
      ELSE
        -- Insert new fine (let IDENTITY generate fine_id)
        INSERT INTO lms_loan_fines (loan_id, fine_amount, paid_flag)
        VALUES (:NEW.loan_id, v_fine_amount, 'N');
      END IF;
    END IF;
  END IF;
END;
/

--Procedure to delete book with DELETE button:

CREATE OR REPLACE PROCEDURE sp_delete_book (
    p_book_id IN lms_books.book_id%TYPE
)
AS
BEGIN
    -- Delete fines for loans of this book
    DELETE FROM lms_loan_fines
     WHERE loan_id IN (
         SELECT loan_id
           FROM lms_loans l
           JOIN lms_book_copies c ON l.copy_id = c.copy_id
          WHERE c.book_id = p_book_id
     );

    -- Delete loans for this book
    DELETE FROM lms_loans
     WHERE copy_id IN (
         SELECT copy_id
           FROM lms_book_copies
          WHERE book_id = p_book_id
     );

    -- Delete copies of this book
    DELETE FROM lms_book_copies
     WHERE book_id = p_book_id;

    -- Finally, delete the book itself
    DELETE FROM lms_books
     WHERE book_id = p_book_id;

    COMMIT;
END;
/

--execute sp_delete_book(11); --If the UI has a Delete Book button


--Procedure used to update a book info:

CREATE OR REPLACE PROCEDURE sp_update_book(
    p_book_id   IN NUMBER,
    p_title     IN VARCHAR2 DEFAULT NULL,
    p_author    IN VARCHAR2 DEFAULT NULL,
    p_pub_year  IN NUMBER   DEFAULT NULL
)
AS
BEGIN
    UPDATE lms_books
    SET
        title    = NVL(p_title, title),
        author   = NVL(p_author, author),
        pub_year = NVL(p_pub_year, pub_year)
    WHERE book_id = p_book_id;

    IF SQL%ROWCOUNT = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Book ID not found');
    END IF;

    COMMIT;
END;
/

/*
 BEGIN
    sp_update_book(
        p_book_id  => 5,
        p_pub_year => 2025
    );
END;
/
*/


--Procedure to add new member:

CREATE OR REPLACE PROCEDURE add_patron_sp(
    p_name        IN VARCHAR2,
    p_member_type IN VARCHAR2,
    p_email       IN VARCHAR2 DEFAULT NULL
)
AS
BEGIN
    INSERT INTO lms_members(full_name, member_type, email)
    VALUES (p_name, p_member_type, p_email);

    COMMIT;
END;
/

/*
BEGIN
    add_patron_sp(
        p_name => 'John Doe',
        p_member_type => 'Student',
        p_email => 'john.doe@example.com'
    );
END;
/
*/


--Procedure to update existing member:

CREATE OR REPLACE PROCEDURE sp_update_member(
    p_member_id   IN NUMBER,
    p_name        IN VARCHAR2 DEFAULT NULL,
    p_member_type IN VARCHAR2 DEFAULT NULL,
    p_email       IN VARCHAR2 DEFAULT NULL
)
AS
BEGIN
    UPDATE lms_members
    SET
        full_name   = NVL(p_name, full_name),
        member_type = NVL(p_member_type, member_type),
        email       = NVL(p_email, email)
    WHERE member_id = p_member_id;

    IF SQL%ROWCOUNT = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Member ID not found');
    END IF;

    COMMIT;
END;
/

/*
BEGIN
    sp_update_member(
        p_member_id => 5,
        p_email     => 'newemail@example.com'
    );
END;
/
*/


--View to display all members:

CREATE OR REPLACE VIEW vw_registered_members AS
SELECT member_id, full_name, member_type, join_date, email
FROM lms_members
ORDER BY full_name;
--select * from vw_registered_members;


--Trigger that updates due_date to 14 days after loan_date when inserting a loan

CREATE OR REPLACE TRIGGER trg_set_default_due_date
BEFORE INSERT ON lms_loans
FOR EACH ROW
BEGIN
    IF :NEW.due_date IS NULL THEN
        :NEW.due_date := NVL(:NEW.loan_date, SYSDATE) + 14;
    END IF;
END;
/


--Procedure to insert loan record after checking the book is available

CREATE OR REPLACE PROCEDURE loan_book_sp(
    p_copy_id    IN NUMBER,
    p_member_id  IN NUMBER,
    p_due_date   IN DATE DEFAULT NULL
)
AS
    v_status lms_book_copies.status%TYPE;
BEGIN
    -- Check if book copy is available
    SELECT status INTO v_status
    FROM lms_book_copies
    WHERE copy_id = p_copy_id;

    IF v_status != 'Available' THEN
        RAISE_APPLICATION_ERROR(-20001, 'Book copy is not available for loan');
    END IF;

    -- Insert loan record
    INSERT INTO lms_loans(copy_id, member_id, loan_date, due_date)
    VALUES (p_copy_id, p_member_id, SYSDATE, p_due_date);

    UPDATE lms_book_copies
    SET status = 'Loaned'
    WHERE copy_id = p_copy_id;

    COMMIT;
END;
/

/*
BEGIN
    loan_book_sp(
        p_copy_id   => 2,
        p_member_id => 6
    );
END;
/
*/


--View to display Book ID, Patron ID, Loan Date, Due Date:

CREATE OR REPLACE VIEW vw_loans_summary AS
SELECT 
    l.loan_id,
    l.copy_id AS book_id,
    l.member_id AS patron_id,
    l.loan_date,
    l.due_date
FROM lms_loans l;

--select * from VW_LOANS_SUMMARY;


--View to display BookID, Patron ID, Loan Date, Due Date

CREATE OR REPLACE VIEW vw_loans_summary AS
SELECT 
    l.loan_id,
    l.copy_id AS book_id,
    l.member_id AS patron_id,
    l.loan_date,
    l.due_date
FROM lms_loans l;

--select * from VW_LOANS_SUMMARY;


--Procedure that updates the return date for a book:

CREATE OR REPLACE PROCEDURE sp_return_book(
    p_loan_id     IN NUMBER,
    p_return_date IN DATE DEFAULT SYSDATE
)
AS
    v_copy_id lms_loans.copy_id%TYPE;
BEGIN
    -- Get the copy_id for this loan
    SELECT copy_id
    INTO v_copy_id
    FROM lms_loans
    WHERE loan_id = p_loan_id;

    -- Update return_date
    UPDATE lms_loans
    SET return_date = p_return_date
    WHERE loan_id = p_loan_id;

    -- Update book copy status back to Available
    UPDATE lms_book_copies
    SET status = 'Available'
    WHERE copy_id = v_copy_id;

    COMMIT;
END;
/

/*
BEGIN
    sp_return_book(3);
END;
/
*/


--View to display overdue books:
CREATE OR REPLACE VIEW vw_overdue_books AS
SELECT
    l.loan_id,
    l.copy_id AS book_id,
    b.title AS book_title,
    l.member_id,
    m.full_name,
    l.loan_date,
    l.due_date,
    NVL(f.fine_amount, 0) AS fine_amount,
    NVL(f.paid_flag, 'N') AS paid_flag,
    TRUNC(SYSDATE) - TRUNC(l.due_date) AS overdue_days,
    'Overdue' AS status
FROM lms_loans l
JOIN lms_book_copies c ON l.copy_id = c.copy_id
JOIN lms_books b ON c.book_id = b.book_id
JOIN lms_members m ON l.member_id = m.member_id
LEFT JOIN lms_loan_fines f ON l.loan_id = f.loan_id
WHERE l.return_date IS NULL
  AND l.due_date < SYSDATE
ORDER BY overdue_days DESC;

--select * from VW_OVERDUE_BOOKS;



--Trigger for fine calculation:

CREATE OR REPLACE TRIGGER trg_calculate_fine_on_return
AFTER UPDATE OF return_date ON lms_loans
FOR EACH ROW
DECLARE
    v_fine_per_day CONSTANT NUMBER := 0.50;
    v_overdue_days NUMBER;
BEGIN
    IF :NEW.return_date IS NOT NULL AND :NEW.return_date > :OLD.due_date THEN
        v_overdue_days := :NEW.return_date - :OLD.due_date;

        -- Insert or update fine
        MERGE INTO lms_loan_fines f
        USING (SELECT :NEW.loan_id AS loan_id FROM dual) src
        ON (f.loan_id = src.loan_id)
        WHEN MATCHED THEN
            UPDATE SET fine_amount = v_overdue_days * v_fine_per_day, paid_flag = 'N'
        WHEN NOT MATCHED THEN
            INSERT (loan_id, fine_amount, paid_flag)
            VALUES (:NEW.loan_id, v_overdue_days * v_fine_per_day, 'N');
    END IF;
END;
/


--Report for Most Borrowed Books:

CREATE OR REPLACE VIEW vw_most_borrowed_books AS
SELECT
    b.book_id,
    b.title AS book_title,
    b.author,
    COUNT(l.loan_id) AS times_borrowed
FROM lms_books b
JOIN lms_book_copies c ON b.book_id = c.book_id
JOIN lms_loans l ON c.copy_id = l.copy_id
GROUP BY b.book_id, b.title, b.author
ORDER BY times_borrowed DESC;

--SELECT * FROM vw_most_borrowed_books;