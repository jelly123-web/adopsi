const fs = require("fs")
const path = require("path")

const out = path.join(__dirname, "..", "docs", "diagram-adopsi.drawio")

function esc(value) {
  return String(value).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]))
}

function cell(id, value, style, x, y, w, h, parent = "1") {
  return `<mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" parent="${parent}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`
}

function edge(id, value, source, target, points = []) {
  const pts = points.map(([x, y]) => `<mxPoint x="${x}" y="${y}" as="point"/>`).join("")
  return `<mxCell id="${id}" value="${esc(value)}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;fontSize=11;strokeColor=#111111;" edge="1" parent="1" source="${source}" target="${target}"><mxGeometry relative="1" as="geometry"><Array as="points">${pts}</Array></mxGeometry></mxCell>`
}

function page(name, body) {
  return `<diagram name="${esc(name)}"><mxGraphModel dx="1600" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1100" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${body.join("")}</root></mxGraphModel></diagram>`
}

const processStyle = "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#b7d7f0;strokeColor=#6b93c8;fontSize=14;"
const processGreen = "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#d5ead0;strokeColor=#82b366;fontSize=14;"
const processYellow = "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffe6cc;strokeColor=#d79b00;fontSize=14;"
const processRed = "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#f8cecc;strokeColor=#b85450;fontSize=14;"
const entityBlue = "rounded=0;whiteSpace=wrap;html=1;fillColor=#d6e8ff;strokeColor=#6b93c8;fontSize=13;"
const entityGreen = "rounded=0;whiteSpace=wrap;html=1;fillColor=#d5ead0;strokeColor=#82b366;fontSize=13;"
const entityRed = "rounded=0;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=13;"
const entityGray = "rounded=0;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#888888;fontSize=13;"
const dbStyle = "shape=cylinder3d;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#ffffff;strokeColor=#111111;fontSize=13;"
const erStyle = "swimlane;whiteSpace=wrap;html=1;startSize=28;fillColor=#ffffff;strokeColor=#666666;fontSize=12;fontStyle=1;"
const decision = "rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=12;"
const terminator = "ellipse;whiteSpace=wrap;html=1;fillColor=#d5ead0;strokeColor=#82b366;fontSize=13;"
const flowProcess = "rounded=0;whiteSpace=wrap;html=1;fillColor=#d6e8ff;strokeColor=#6b93c8;fontSize=12;"

const dfd1 = [
  cell("d1_title", "DFD Level 1 - Sistem Adopsi Hewan", "text;html=1;strokeColor=none;fillColor=none;fontSize=24;fontStyle=1;", 560, 20, 460, 40),
  cell("d1_cust", "Customer", entityBlue, 205, 75, 160, 65),
  cell("d1_super", "Superadmin", entityBlue, 35, 520, 160, 65),
  cell("d1_admin", "Admin", entityBlue, 975, 545, 160, 65),
  cell("d1_petugas", "Petugas", entityBlue, 1070, 105, 160, 65),
  cell("d1_p1", "1.1<br>Input<br>Pengajuan", processStyle, 635, 35, 130, 130),
  cell("d1_p2", "1.2<br>Verifikasi<br>Adopsi", processStyle, 1130, 410, 130, 130),
  cell("d1_p3", "1.3<br>Kelola<br>Master Data", processStyle, 395, 335, 130, 130),
  cell("d1_p4", "1.4<br>Chat &<br>Konsultasi", processStyle, 950, 225, 130, 130),
  cell("d1_p5", "1.5<br>Kelola<br>Jadwal Pickup", processStyle, 505, 825, 130, 130),
  cell("d1_p6", "1.6<br>Laporan &<br>Monitoring", processStyle, 300, 680, 130, 130),
  cell("d1_users", "Data<br>User", dbStyle, 575, 470, 130, 75),
  cell("d1_master", "Data Hewan<br>Kategori", dbStyle, 625, 225, 150, 75),
  cell("d1_req", "Data Pengajuan<br>Adopsi", dbStyle, 1380, 225, 155, 75),
  cell("d1_chat", "Data<br>Chat", dbStyle, 1360, 475, 145, 75),
  cell("d1_logs", "Data Aktivitas<br>Settings", dbStyle, 275, 495, 170, 75),
  cell("d1_backup", "Data Backup<br>Restore", dbStyle, 945, 835, 170, 75),
  edge("d1_e1", "lihat hewan / status pengajuan", "d1_cust", "d1_p1"),
  edge("d1_e2", "info hewan / status adopsi", "d1_p1", "d1_cust"),
  edge("d1_e3", "data hewan", "d1_master", "d1_p1"),
  edge("d1_e4", "data pengajuan", "d1_p1", "d1_req"),
  edge("d1_e5", "kelola user, hewan, kategori, setting", "d1_super", "d1_p3"),
  edge("d1_e6", "info master data", "d1_p3", "d1_super"),
  edge("d1_e7", "data user", "d1_p3", "d1_users"),
  edge("d1_e8", "data master", "d1_p3", "d1_master"),
  edge("d1_e9", "log aktivitas / pengaturan", "d1_p3", "d1_logs"),
  edge("d1_e10", "review pengajuan", "d1_req", "d1_p2"),
  edge("d1_e11", "setujui / tolak pengajuan", "d1_admin", "d1_p2"),
  edge("d1_e12", "update status adopsi", "d1_p2", "d1_req"),
  edge("d1_e13", "update status hewan", "d1_p2", "d1_master"),
  edge("d1_e14", "pesan customer", "d1_cust", "d1_p4"),
  edge("d1_e15", "balasan chat", "d1_petugas", "d1_p4"),
  edge("d1_e16", "riwayat chat", "d1_p4", "d1_chat"),
  edge("d1_e17", "jadwal kunjungan / pickup", "d1_req", "d1_p5"),
  edge("d1_e18", "update jadwal pickup", "d1_p5", "d1_req"),
  edge("d1_e19", "info jadwal", "d1_p5", "d1_cust"),
  edge("d1_e20", "permintaan laporan", "d1_super", "d1_p6"),
  edge("d1_e21", "laporan / dashboard", "d1_p6", "d1_super"),
  edge("d1_e22", "ringkasan adopsi", "d1_req", "d1_p6"),
  edge("d1_e23", "data user/hewan", "d1_users", "d1_p6"),
  edge("d1_e24", "backup / restore", "d1_p6", "d1_backup"),
]

const dfd2 = [
  cell("d2_title", "DFD Level 2 - Sistem Adopsi Hewan", "text;html=1;strokeColor=none;fillColor=none;fontSize=24;fontStyle=1;", 560, 20, 460, 40),
  cell("d2_cust", "Customer", entityRed, 40, 150, 150, 60),
  cell("d2_super", "Superadmin", entityBlue, 40, 70, 150, 60),
  cell("d2_admin", "Admin", entityBlue, 40, 740, 150, 60),
  cell("d2_petugas", "Petugas", entityGreen, 1260, 300, 150, 60),
  cell("d2_p1", "2.1<br>Kelola Akun<br>& Hak Akses", processGreen, 360, 65, 125, 125),
  cell("d2_p2", "2.2<br>Kelola Master<br>Hewan & Kategori", processYellow, 360, 690, 140, 140),
  cell("d2_p3", "2.3<br>Input & Proses<br>Pengajuan", processStyle, 360, 260, 140, 140),
  cell("d2_p4", "2.4<br>Verifikasi<br>Adopsi", processGreen, 650, 315, 130, 130),
  cell("d2_p5", "2.5<br>Jadwal Kunjungan<br>& Pickup", processYellow, 910, 315, 145, 145),
  cell("d2_p6", "2.6<br>Chat Customer", processGreen, 910, 95, 125, 125),
  cell("d2_p7", "2.7<br>Laporan &<br>Monitoring", processRed, 1180, 620, 140, 140),
  cell("d2_p8", "2.8<br>Backup,<br>Restore & Log", processRed, 650, 760, 140, 140),
  cell("d2_users", "Data User<br>& Hak Akses", dbStyle, 585, 70, 160, 75),
  cell("d2_master", "Data Hewan<br>& Kategori", dbStyle, 585, 690, 160, 75),
  cell("d2_req", "Data Pengajuan<br>& Adopsi", dbStyle, 840, 255, 175, 75),
  cell("d2_chat", "Data Chat", dbStyle, 1120, 95, 145, 70),
  cell("d2_logs", "Data Aktivitas<br>& Settings", dbStyle, 930, 790, 175, 75),
  edge("d2_e1", "kelola akun", "d2_super", "d2_p1"),
  edge("d2_e2", "info akun & akses", "d2_p1", "d2_super"),
  edge("d2_e3", "data user", "d2_p1", "d2_users"),
  edge("d2_e4", "registrasi / login", "d2_cust", "d2_p1"),
  edge("d2_e5", "lihat hewan & ajukan adopsi", "d2_cust", "d2_p3"),
  edge("d2_e6", "status pengajuan", "d2_p3", "d2_cust"),
  edge("d2_e7", "data master", "d2_master", "d2_p3"),
  edge("d2_e8", "data pengajuan", "d2_p3", "d2_req"),
  edge("d2_e9", "kelola hewan/kategori", "d2_admin", "d2_p2"),
  edge("d2_e10", "data master", "d2_p2", "d2_master"),
  edge("d2_e11", "review data pengajuan", "d2_req", "d2_p4"),
  edge("d2_e12", "setujui / tolak", "d2_admin", "d2_p4"),
  edge("d2_e13", "hasil verifikasi", "d2_p4", "d2_req"),
  edge("d2_e14", "data adopsi disetujui", "d2_req", "d2_p5"),
  edge("d2_e15", "atur jadwal pickup", "d2_petugas", "d2_p5"),
  edge("d2_e16", "update pickup & status hewan", "d2_p5", "d2_req"),
  edge("d2_e17", "pesan customer", "d2_cust", "d2_p6"),
  edge("d2_e18", "balasan admin/petugas", "d2_petugas", "d2_p6"),
  edge("d2_e19", "riwayat chat", "d2_p6", "d2_chat"),
  edge("d2_e20", "data transaksi adopsi", "d2_req", "d2_p7"),
  edge("d2_e21", "laporan / dashboard", "d2_p7", "d2_super"),
  edge("d2_e22", "laporan operasional", "d2_p7", "d2_admin"),
  edge("d2_e23", "backup, restore, settings", "d2_super", "d2_p8"),
  edge("d2_e24", "log aktivitas", "d2_p8", "d2_logs"),
]

function erEntity(id, name, fields, x, y, w, h) {
  return cell(id, `${name}<br><hr>${fields.join("<br>")}`, erStyle, x, y, w, h)
}

const erd = [
  cell("er_title", "ERD - Sistem Adopsi Hewan", "text;html=1;strokeColor=none;fillColor=none;fontSize=24;fontStyle=1;", 610, 20, 360, 40),
  erEntity("er_users", "USERS", ["- (PK) id", "- name", "- email", "- password", "- profile_photo", "- profile_bg_photo", "- reset_password_token", "- reset_password_expires_at", "- role", "- status", "- created_at", "- updated_at", "- deleted", "- deleted_by", "- deleted_at", "- deleted_ip"], 40, 95, 250, 350),
  erEntity("er_animals", "ANIMALS", ["- (PK) id", "- name", "- species", "- gender", "- age", "- activity_preference", "- status", "- condition", "- photo", "- created_at", "- updated_at", "- deleted", "- deleted_by", "- deleted_at", "- deleted_ip"], 510, 90, 250, 330),
  erEntity("er_categories", "CATEGORIES", ["- (PK) id", "- name", "- created_at", "- updated_at", "- deleted", "- deleted_by", "- deleted_at", "- deleted_ip"], 510, 520, 230, 210),
  erEntity("er_requests", "ADOPTION_REQUESTS", ["- (PK) id", "- (FK) user_id", "- (FK) animal_id", "- full_name", "- phone", "- address", "- job", "- family_count", "- housing_type", "- pet_experience", "- reason", "- document_url", "- rejection_reason", "- pickup_date", "- pickup_status", "- status", "- created_at", "- updated_at", "- deleted"], 880, 70, 290, 430),
  erEntity("er_adoptions", "ADOPTIONS", ["- (PK) id", "- (FK) request_id", "- (FK) user_id", "- (FK) animal_id", "- status", "- approved_at", "- created_at", "- updated_at", "- deleted", "- deleted_by", "- deleted_at", "- deleted_ip"], 1260, 105, 250, 290),
  erEntity("er_chat", "CHAT_MESSAGES", ["- (PK) id", "- msg_id", "- (FK) user_id", "- sender", "- sender_name", "- target_role", "- text", "- topic", "- is_read", "- created_at"], 40, 560, 250, 250),
  erEntity("er_activities", "ACTIVITIES", ["- (PK) id", "- type", "- title", "- description", "- entity_type", "- entity_id", "- user_name", "- user_email", "- user_role", "- ip_address", "- latitude", "- longitude", "- location_name", "- created_at", "- updated_at", "- deleted"], 870, 610, 270, 350),
  erEntity("er_settings", "SETTINGS", ["- (PK) id", "- setting_key", "- setting_value", "- created_at", "- updated_at"], 1260, 610, 230, 150),
  erEntity("er_questions", "QUESTIONNAIRE_QUESTIONS", ["- (PK) id", "- question", "- answer_type", "- status", "- created_at", "- updated_at", "- deleted", "- deleted_by", "- deleted_at", "- deleted_ip"], 500, 825, 280, 250),
  edge("er_e1", "user_id", "er_users", "er_requests", [[350, 170], [350, 170]]),
  edge("er_e2", "animal_id", "er_animals", "er_requests"),
  edge("er_e3", "request_id", "er_requests", "er_adoptions"),
  edge("er_e4", "user_id", "er_users", "er_adoptions", [[350, 330], [350, 330], [1220, 330]]),
  edge("er_e5", "animal_id", "er_animals", "er_adoptions", [[815, 245], [815, 245]]),
  edge("er_e6", "user_id", "er_users", "er_chat"),
]

const flow = [
  cell("fl_title", "Flowchart - Proses Adopsi Hewan", "text;html=1;strokeColor=none;fillColor=none;fontSize=24;fontStyle=1;", 560, 20, 470, 40),
  cell("fl_start", "Mulai", terminator, 700, 80, 120, 60),
  cell("fl_login", "Customer registrasi / login", flowProcess, 660, 170, 200, 60),
  cell("fl_browse", "Lihat daftar hewan tersedia", flowProcess, 660, 270, 200, 60),
  cell("fl_pick", "Pilih hewan untuk diadopsi", flowProcess, 660, 370, 200, 60),
  cell("fl_form", "Isi form pengajuan dan upload dokumen", flowProcess, 640, 470, 240, 70),
  cell("fl_admin", "Admin / Petugas memeriksa pengajuan", flowProcess, 625, 590, 270, 70),
  cell("fl_decide", "Pengajuan disetujui?", decision, 685, 715, 150, 110),
  cell("fl_reject", "Simpan alasan penolakan dan tampilkan status ditolak", flowProcess, 350, 740, 240, 80),
  cell("fl_schedule", "Atur jadwal kunjungan / pickup", flowProcess, 930, 740, 230, 70),
  cell("fl_done", "Update status adopsi dan hewan diadopsi", flowProcess, 930, 850, 240, 70),
  cell("fl_report", "Catat log aktivitas dan tampilkan laporan", flowProcess, 650, 950, 250, 70),
  cell("fl_end", "Selesai", terminator, 710, 1045, 120, 60),
  edge("fl_e1", "", "fl_start", "fl_login"),
  edge("fl_e2", "", "fl_login", "fl_browse"),
  edge("fl_e3", "", "fl_browse", "fl_pick"),
  edge("fl_e4", "", "fl_pick", "fl_form"),
  edge("fl_e5", "", "fl_form", "fl_admin"),
  edge("fl_e6", "", "fl_admin", "fl_decide"),
  edge("fl_e7", "Tidak", "fl_decide", "fl_reject"),
  edge("fl_e8", "Ya", "fl_decide", "fl_schedule"),
  edge("fl_e9", "", "fl_schedule", "fl_done"),
  edge("fl_e10", "", "fl_reject", "fl_report"),
  edge("fl_e11", "", "fl_done", "fl_report"),
  edge("fl_e12", "", "fl_report", "fl_end"),
]

const xml = `<mxfile host="app.diagrams.net" modified="2026-08-01T00:00:00.000Z" agent="Codex" version="24.7.17" type="device">${[
  page("DFD Level 1", dfd1),
  page("DFD Level 2", dfd2),
  page("ERD", erd),
  page("Flowchart", flow),
].join("")}</mxfile>`

fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, xml, "utf8")
console.log(out)
