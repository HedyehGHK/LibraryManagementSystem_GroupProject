// ===========================
// API BASE URL
// ===========================
const API_BASE = "http://localhost:3000/api";


// =====================================================================
// ==========================  BOOKS SECTION ============================
// =====================================================================

if (window.location.pathname.includes("books.html")) {
    loadBooks();

    document.getElementById("addBookForm").addEventListener("submit", e => {
        e.preventDefault();
        addBook();
    });

    document.getElementById("updateMemberForm")?.addEventListener("submit", e => {
        e.preventDefault();
        updateBook();
    });
}


// LOAD ALL BOOKS
async function loadBooks() {
    try {
        const res = await fetch(`${API_BASE}/books`);
        const json = await res.json();

        const table = document.getElementById("booksTableBody");
        table.innerHTML = "";

        json.data.forEach(b => {
            table.innerHTML += `
            <tr>
                <td>${b.BOOK_ID}</td>
                <td>${b.TITLE}</td>
                <td>${b.AUTHOR}</td>
                <td>${b.PUBLISHER_NAME}</td>
                <td>${b.TOTAL_COPIES}</td>
                <td>${b.AVAILABLE_COPIES}</td>
                <td>${b.LOANED_COPIES}</td>
                <td>${b.LOST_COPIES}</td>
            </tr>`;
        });

    } catch (err) {
        console.error("Error loading books:", err);
    }
}


// ADD BOOK
async function addBook() {
    const book = {
        title: title.value,
        author: author.value,
        publisher_id: publisher_id.value,
        isbn: isbn.value,
        pub_year: pub_year.value
    };

    try {
        const res = await fetch(`${API_BASE}/books`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(book)
        });

        const json = await res.json();
        alert(json.message || json.error);
        loadBooks();

    } catch (err) {
        alert("Error adding book");
        console.error(err);
    }
}


// UPDATE BOOK
async function updateBook() {
    const id = document.getElementById("update_id").value;

    const body = {
        title: document.getElementById("update_title").value,
        author: document.getElementById("update_author").value,
        pub_year: document.getElementById("update_year").value
    };

    const res = await fetch(`${API_BASE}/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const json = await res.json();
    alert(json.message || json.error);
    loadBooks();
}


// DELETE BOOK
async function deleteBook() {
    const id = document.getElementById("delete_id").value;

    const res = await fetch(`${API_BASE}/books/${id}`, {
        method: "DELETE"
    });

    const json = await res.json();
    alert(json.message || json.error);
    loadBooks();
}


// SEARCH BOOKS
async function searchBooks() {
    const title = searchTitle.value.trim();
    const author = searchAuthor.value.trim();

    let url = null;

    if (title) {
        url = `${API_BASE}/books/search/title/${title}`;
    } else if (author) {
        url = `${API_BASE}/books/search/author/${author}`;
    } else {
        return loadBooks();
    }

    const res = await fetch(url);
    const json = await res.json();

    const table = document.getElementById("booksTableBody");
    table.innerHTML = "";

    json.data.forEach(b => {
        table.innerHTML += `
        <tr>
            <td>${b.BOOK_ID}</td>
            <td>${b.TITLE}</td>
            <td>${b.AUTHOR}</td>
            <td>${b.PUBLISHER_NAME}</td>
            <td>${b.TOTAL_COPIES}</td>
            <td>${b.AVAILABLE_COPIES}</td>
            <td>${b.LOANED_COPIES}</td>
            <td>${b.LOST_COPIES}</td>
        </tr>`;
    });
}






// =====================================================================
// ==========================  MEMBERS SECTION ==========================
// =====================================================================

if (window.location.pathname.includes("member.html")) {

    loadMembers();

    document.getElementById("addMemberForm").addEventListener("submit", e => {
        e.preventDefault();
        addMember();
    });

    document.getElementById("updateMemberForm").addEventListener("submit", e => {
        e.preventDefault();
        updateMember();
    });

    document.getElementById("updateEmailForm").addEventListener("submit", e => {
        e.preventDefault();
        updateEmail();
    });
}



// LOAD ALL MEMBERS
async function loadMembers() {
    try {
        const res = await fetch(`${API_BASE}/member`);
        const json = await res.json();

        const table = document.getElementById("memberTableBody");
        table.innerHTML = "";

        json.data.forEach(m => {
            table.innerHTML += `
            <tr>
                <td>${m.MEMBER_ID}</td>
                <td>${m.FULL_NAME}</td>
                <td>${m.MEMBER_TYPE}</td>
                <td>${m.JOIN_DATE}</td>
                <td>${m.EMAIL}</td>
            </tr>`;
        });

    } catch (err) {
        console.error("Error loading members:", err);
    }
}



// ADD MEMBER
async function addMember() {
    const member = {
        name: document.getElementById("m_name").value,
        member_type: document.getElementById("m_type").value,
        email: document.getElementById("m_email").value
    };

    const res = await fetch(`${API_BASE}/member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member)
    });

    const json = await res.json();
    alert(json.message || json.error);
    loadMembers();
}



// UPDATE MEMBER (FULL)
async function updateMember() {
    const id = document.getElementById("u_id").value;

    const body = {
        name: document.getElementById("u_name").value,
        member_type: document.getElementById("u_type").value,
        email: document.getElementById("u_email").value
    };

    const res = await fetch(`${API_BASE}/member/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const json = await res.json();
    alert(json.message || json.error);
    loadMembers();
}



// UPDATE EMAIL ONLY
async function updateEmail() {
    const id = document.getElementById("e_id").value;

    const body = { email: document.getElementById("e_email").value };

    const res = await fetch(`${API_BASE}/member/${id}/email`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const json = await res.json();
    alert(json.message || json.error);
    loadMembers();
}



// GET LOAN COUNT
async function getLoanCount() {
    const id = document.getElementById("lc_id").value;

    const res = await fetch(`${API_BASE}/member/${id}/loan-count`);
    const json = await res.json();

    document.getElementById("loanCountOutput").innerHTML =
        `Total Loans: <b>${json.data.TOTAL_LOANS}</b>`;
}

// =====================================================================
// ============================= LOANS =================================
// =====================================================================

if (window.location.pathname.includes("loans.html")) {

    loadLoans();

    document.getElementById("loanForm").addEventListener("submit", e => {
        e.preventDefault();
        loanBook();
    });

    document.getElementById("returnForm").addEventListener("submit", e => {
        e.preventDefault();
        returnBook();
    });

    document.getElementById("fineForm").addEventListener("submit", e => {
        e.preventDefault();
        applyFines();
    });
}


// ================= LOAD ALL LOANS =================
async function loadLoans() {
    try {
        const res = await fetch(`${API_BASE}/loans`);
        const json = await res.json();

        const table = document.getElementById("loanTableBody");
        table.innerHTML = "";

        json.data.forEach(l => {
            table.innerHTML += `
            <tr>
                <td>${l.LOAN_ID}</td>
                <td>${l.BOOK_ID}</td>
                <td>${l.PATRON_ID}</td>
                <td>${l.LOAN_DATE}</td>
                <td>${l.DUE_DATE}</td>
            </tr>`;
        });

    } catch (err) {
        console.error("Error loading loans:", err);
    }
}



// ================= LOAN BOOK =================
async function loanBook() {

    const body = {
        copy_id: document.getElementById("copy_id").value,
        member_id: document.getElementById("loan_member_id").value,
        due_date: document.getElementById("loan_due_date").value || null
    };

    try {
        const res = await fetch(`${API_BASE}/loans`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const json = await res.json();
        alert(json.message || json.error);

        loadLoans();

    } catch (err) {
        console.error("Loan error:", err);
        alert("Failed to loan book");
    }
}



// ================= RETURN BOOK =================
async function returnBook() {

    const loan_id = document.getElementById("return_loan_id").value;

    const body = {
        return_date: document.getElementById("return_date").value || null
    };

    try {
        const res = await fetch(`${API_BASE}/loans/${loan_id}/return`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const json = await res.json();
        alert(json.message || json.error);

        loadLoans();

    } catch (err) {
        console.error("Return error:", err);
        alert("Failed to return book");
    }
}



// ================= APPLY FINES =================
async function applyFines() {

    const fine = document.getElementById("fine_per_day").value || 0.50;

    try {
        const res = await fetch(`${API_BASE}/loans/apply-fines`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fine_per_day: fine })
        });

        const json = await res.json();
        alert(json.message || json.error);

    } catch (err) {
        console.error("Fine error:", err);
        alert("Failed to apply fines");
    }
}

// =====================================================================
// ============================= REPORTS ================================
// =====================================================================

if (window.location.pathname.includes("reports.html")) {
    // صفحه گزارش‌ها هیچ فرم submit ندارد
}


// Helper برای ساخت جدول
function renderTable(data) {
    const thead = document.getElementById("reportHead");
    const tbody = document.getElementById("reportBody");

    tbody.innerHTML = "";
    thead.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = "<tr><td>No Data Found</td></tr>";
        return;
    }

    // ساخت هدر
    const columns = Object.keys(data[0]);
    thead.innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join("")}</tr>`;

    // ساخت ردیف‌ها
    data.forEach(row => {
        tbody.innerHTML += `
            <tr>${columns.map(c => `<td>${row[c]}</td>`).join("")}</tr>
        `;
    });
}



// ============= OVERDUE BOOKS =================
async function loadOverdue() {
    const res = await fetch(`${API_BASE}/reports/overdue`);
    const json = await res.json();
    renderTable(json.data);
}



// ============= OVERDUE + FINES =================
async function loadOverdueWithFines() {
    const res = await fetch(`${API_BASE}/reports/overdue-with-fines`);
    const json = await res.json();
    renderTable(json.data);
}



// ============= UNPAID FINES =================
async function loadUnpaidFines() {
    const res = await fetch(`${API_BASE}/reports/unpaid-fines`);
    const json = await res.json();
    renderTable(json.data);
}



// ============= TOP 5 =================
async function loadTop5() {
    const res = await fetch(`${API_BASE}/reports/top5`);
    const json = await res.json();
    renderTable(json.data);
}



// ============= MOST BORROWED =================
async function loadMostBorrowed() {
    const res = await fetch(`${API_BASE}/reports/most-borrowed`);
    const json = await res.json();
    renderTable(json.data);
}



// ============= BOOK COPY STATUS =================
async function loadCopyStatus() {
    const id = document.getElementById("copy_status_id").value;

    const res = await fetch(`${API_BASE}/reports/book-copy-status/${id}`);
    const json = await res.json();
    renderTable(json.data);
}



// ============= PAY FINE =================
async function payFine() {
    const id = document.getElementById("fine_loan_id").value;

    const res = await fetch(`${API_BASE}/reports/pay-fine/${id}`, {
        method: "PUT"
    });

    const json = await res.json();
    alert(json.message || json.error);
}

