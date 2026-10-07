const SUPABASE_URL =
    "https://ertcnkevohvyzrdcbvhw.supabase.co/rest/v1/";

const SUPABASE_KEY =
    "sb_publishable_tSxwXRj2o5yOJ-BRLTeYcQ_elVCfkwr";


const {
    createClient
} = supabase;


const db =
    createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ============================================
// SUBMIT PENGADUAN
// ============================================

document
    .getElementById("complaintForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const button =
                event.target.querySelector(
                    "button[type='submit']"
                );

            button.disabled = true;
            button.textContent = "Mengirim...";


            try {

                // Buat nomor tiket
                const {
                    data: ticketData,
                    error: ticketError
                } = await db.rpc(
                    "generate_ticket"
                );


                if (ticketError)
                    throw ticketError;


                const ticket =
                    ticketData;


                const complaint = {

                    ticket_number: ticket,

                    name:
                        document
                        .getElementById("name")
                        .value
                        .trim(),

                    email:
                        document
                        .getElementById("email")
                        .value
                        .trim(),

                    phone:
                        document
                        .getElementById("phone")
                        .value
                        .trim(),

                    category:
                        document
                        .getElementById("category")
                        .value,

                    title:
                        document
                        .getElementById("title")
                        .value
                        .trim(),

                    description:
                        document
                        .getElementById("description")
                        .value
                        .trim()

                };


                const {
                    error
                } = await db
                    .from("complaints")
                    .insert(complaint);


                if (error)
                    throw error;


                document
                    .getElementById("complaintForm")
                    .reset();


                document
                    .getElementById("ticketResult")
                    .textContent = ticket;


                document
                    .getElementById("successBox")
                    .hidden = false;


                document
                    .getElementById("successBox")
                    .scrollIntoView({
                        behavior: "smooth"
                    });

            }

            catch(error) {

                console.error(error);

                alert(
                    "Pengaduan gagal dikirim. Silakan coba lagi."
                );

            }

            finally {

                button.disabled = false;

                button.textContent =
                    "Kirim Pengaduan";

            }

        }
    );


// ============================================
// COPY TICKET
// ============================================

function copyTicket() {

    const ticket =
        document
        .getElementById("ticketResult")
        .textContent;

    navigator
        .clipboard
        .writeText(ticket);

    alert(
        "Nomor tiket berhasil disalin."
    );

}


// ============================================
// CEK PENGADUAN
// ============================================

async function checkComplaint() {

    const ticket =
        document
        .getElementById("ticket")
        .value
        .trim();

    const email =
        document
        .getElementById("checkEmail")
        .value
        .trim();


    if (!ticket || !email) {

        alert(
            "Nomor tiket dan email wajib diisi."
        );

        return;

    }


    const result =
        document
        .getElementById("statusResult");


    result.hidden = false;

    result.innerHTML =
        "Sedang mencari pengaduan...";


    try {

        const {
            data,
            error
        } = await db.rpc(
            "check_ticket",
            {
                p_ticket: ticket,
                p_email: email
            }
        );


        if (error)
            throw error;


        if (!data || data.length === 0) {

            result.innerHTML = `

                <h3>
                    Pengaduan Tidak Ditemukan
                </h3>

                <p>
                    Periksa kembali nomor tiket
                    dan email yang digunakan.
                </p>

            `;

            return;

        }


        const complaint =
            data[0];


        result.innerHTML = `

            <h3>
                ${escapeHTML(complaint.title)}
            </h3>

            <p>
                Nomor tiket:
                <strong>
                    ${escapeHTML(complaint.ticket_number)}
                </strong>
            </p>

            <br>

            <span class="status">
                ${escapeHTML(complaint.status)}
            </span>

            <div class="timeline">

                <div class="timeline-item">

                    <strong>
                        Pengaduan diterima
                    </strong>

                    <small>
                        ${formatDate(complaint.created_at)}
                    </small>

                </div>

                ${
                    complaint.status !== "Diterima"
                    ? `
                    <div class="timeline-item">

                        <strong>
                            Pengaduan diverifikasi
                        </strong>

                    </div>
                    `
                    : ""
                }

                ${
                    complaint.status === "Ditindaklanjuti" ||
                    complaint.status === "Selesai"

                    ? `
                    <div class="timeline-item">

                        <strong>
                            Pengaduan ditindaklanjuti
                        </strong>

                    </div>
                    `
                    : ""
                }

                ${
                    complaint.status === "Selesai"

                    ? `
                    <div class="timeline-item">

                        <strong>
                            Pengaduan selesai
                        </strong>

                    </div>
                    `
                    : ""
                }

            </div>


            ${
                complaint.admin_note

                ? `
                <div class="privacy">

                    <strong>
                        Catatan tindak lanjut:
                    </strong>

                    <br>

                    ${escapeHTML(
                        complaint.admin_note
                    )}

                </div>
                `
                : ""
            }

        `;

    }

    catch(error) {

        console.error(error);

        result.innerHTML =
            "Terjadi kesalahan saat mencari data.";

    }

}


// ============================================
// KEAMANAN HTML
// ============================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ============================================
// FORMAT TANGGAL
// ============================================

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
