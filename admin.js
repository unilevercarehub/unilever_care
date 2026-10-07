const SUPABASE_URL =
    "MASUKKAN_SUPABASE_URL";

const SUPABASE_KEY =
    "MASUKKAN_SUPABASE_ANON_KEY";


const {
    createClient
} = supabase;


const db =
    createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


let complaints = [];


// ============================================
// CEK LOGIN SAAT HALAMAN DIBUKA
// ============================================

checkSession();


async function checkSession() {

    const {
        data
    } = await db.auth.getSession();


    if (data.session) {

        await showDashboard();

    }

}


// ============================================
// LOGIN
// ============================================

async function login() {

    const email =
        document
        .getElementById("adminEmail")
        .value;

    const password =
        document
        .getElementById("adminPassword")
        .value;


    if (!email || !password) {

        alert(
            "Email dan password wajib diisi."
        );

        return;

    }


    const {
        data,
        error
    } = await db.auth.signInWithPassword({
        email,
        password
    });


    if (error) {

        alert(
            "Login gagal. Periksa email dan password."
        );

        return;

    }


    await showDashboard();

}


// ============================================
// DASHBOARD
// ============================================

async function showDashboard() {

    const {
        data: profile
    } = await db
        .from("admin_profiles")
        .select("*")
        .eq("id", (await db.auth.getUser()).data.user.id)
        .single();


    if (!profile) {

        await db.auth.signOut();

        alert(
            "Akun ini bukan administrator."
        );

        return;

    }


    document
        .getElementById("loginBox")
        .hidden = true;


    document
        .getElementById("dashboard")
        .hidden = false;


    loadComplaints();

}


// ============================================
// LOAD DATA
// ============================================

async function loadComplaints() {

    const {
        data,
        error
    } = await db
        .from("complaints")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

        alert(
            "Data gagal dimuat."
        );

        return;

    }


    complaints = data || [];


    updateStatistics();

    renderTable(
        complaints
    );

}


// ============================================
// STATISTIK
// ============================================

function updateStatistics() {

    document
        .getElementById("adminTotal")
        .textContent =
        complaints.length;


    document
        .getElementById("adminReceived")
        .textContent =
        complaints.filter(
            x => x.status === "Diterima"
        ).length;


    document
        .getElementById("adminDone")
        .textContent =
        complaints.filter(
            x => x.status === "Selesai"
        ).length;

}


// ============================================
// TABLE
// ============================================

function renderTable(data) {

    const tbody =
        document
        .querySelector("#complaintTable tbody");


    tbody.innerHTML = "";


    data.forEach(item => {

        const row =
            document.createElement("tr");


        row.style.borderTop =
            "1px solid #dfe8e3";


        row.innerHTML = `

            <td style="padding:10px;">

                <button
                    onclick="showDetail('${item.id}')"
                    style="
                        border:none;
                        background:none;
                        color:#087f52;
                        font-weight:bold;
                        cursor:pointer;
                    ">

                    ${escapeHTML(
                        item.ticket_number
                    )}

                </button>

            </td>


            <td style="padding:10px;">
                ${escapeHTML(item.name)}
            </td>


            <td style="padding:10px;">
                ${escapeHTML(item.category)}
            </td>


            <td style="padding:10px;">
                ${escapeHTML(item.status)}
            </td>


            <td style="padding:10px;">
                ${formatDate(item.created_at)}
            </td>

        `;


        tbody.appendChild(row);

    });

}


// ============================================
// SEARCH
// ============================================

function filterComplaints() {

    const keyword =
        document
        .getElementById("searchBox")
        .value
        .toLowerCase();


    const filtered =
        complaints.filter(item =>

            item.ticket_number
                .toLowerCase()
                .includes(keyword)

            ||

            item.name
                .toLowerCase()
                .includes(keyword)

            ||

            item.category
                .toLowerCase()
                .includes(keyword)

        );


    renderTable(filtered);

}


// ============================================
// DETAIL
// ============================================

function showDetail(id) {

    const item =
        complaints.find(
            x => x.id === id
        );


    if (!item)
        return;


    const detail =
        document
        .getElementById("detailBox");


    const content =
        document
        .getElementById("detailContent");


    detail.hidden = false;


    content.innerHTML = `

        <p>
            <strong>Nomor Tiket:</strong>
            ${escapeHTML(item.ticket_number)}
        </p>

        <p>
            <strong>Nama:</strong>
            ${escapeHTML(item.name)}
        </p>

        <p>
            <strong>Email:</strong>
            ${escapeHTML(item.email)}
        </p>

        <p>
            <strong>WhatsApp:</strong>
            ${escapeHTML(item.phone || "-")}
        </p>

        <p>
            <strong>Kategori:</strong>
            ${escapeHTML(item.category)}
        </p>

        <p>
            <strong>Judul:</strong>
            ${escapeHTML(item.title)}
        </p>

        <br>

        <p>
            <strong>Kronologi:</strong>
        </p>

        <p>
            ${escapeHTML(item.description)}
        </p>

        <br>

        <label>
            Status
        </label>

        <select id="newStatus">

            <option
                ${item.status === "Diterima" ? "selected" : ""}>
                Diterima
            </option>

            <option
                ${item.status === "Diverifikasi" ? "selected" : ""}>
                Diverifikasi
            </option>

            <option
                ${item.status === "Ditindaklanjuti" ? "selected" : ""}>
                Ditindaklanjuti
            </option>

            <option
                ${item.status === "Selesai" ? "selected" : ""}>
                Selesai
            </option>

        </select>

        <br><br>

        <label>
            Catatan Tindak Lanjut
        </label>

        <textarea
            id="adminNote"
            placeholder="Tuliskan hasil tindak lanjut..."
        >${escapeHTML(item.admin_note || "")}</textarea>

        <br><br>

        <button
            class="button primary"
            onclick="updateComplaint('${item.id}')">

            Simpan Perubahan

        </button>

    `;


    detail.scrollIntoView({
        behavior: "smooth"
    });

}


// ============================================
// UPDATE
// ============================================

async function updateComplaint(id) {

    const newStatus =
        document
        .getElementById("newStatus")
        .value;


    const adminNote =
        document
        .getElementById("adminNote")
        .value;


    const old =
        complaints.find(
            x => x.id === id
        );


    const {
        data: userData
    } =
        await db.auth.getUser();


    const {
        error
    } = await db
        .from("complaints")
        .update({

            status: newStatus,

            admin_note: adminNote

        })
        .eq("id", id);


    if (error) {

        console.error(error);

        alert(
            "Perubahan gagal disimpan."
        );

        return;

    }


    // Simpan riwayat
    await db
        .from("complaint_history")
        .insert({

            complaint_id: id,

            status: newStatus,

            note: adminNote,

            changed_by:
                userData.user.id

        });


    alert(
        "Pengaduan berhasil diperbarui."
    );


    await loadComplaints();

}


// ============================================
// LOGOUT
// ============================================

async function logout() {

    await db.auth.signOut();

    location.reload();

}


// ============================================
// HELPERS
// ============================================

function escapeHTML(value) {

    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function formatDate(date) {

    return new Date(date)
        .toLocaleString(
            "id-ID",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

}
