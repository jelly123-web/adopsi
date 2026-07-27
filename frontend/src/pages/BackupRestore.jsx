import { useEffect, useState } from "react";
import axios from "axios";
import "../App.css";

export default function BackupRestore() {
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const [backupName, setBackupName] = useState("");
  const [description, setDescription] = useState("");

  const [file, setFile] = useState(null);

  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await axios.get("/api/backup/history");
      setHistory(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleBackup = async () => {
    if (!backupName) {
      alert("Nama backup wajib diisi");
      return;
    }

    try {
      setLoading(true);

      await axios.post("/api/backup", {
        name: backupName,
        description,
      });

      alert("Backup berhasil");

      setBackupName("");
      setDescription("");

      loadHistory();
    } catch (err) {
      alert("Backup gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!file) {
      alert("Pilih file backup");
      return;
    }

    const formData = new FormData();
    formData.append("backup", file);

    try {
      setRestoreLoading(true);

      await axios.post("/api/restore", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Restore berhasil");

      loadHistory();
    } catch (err) {
      alert("Restore gagal");
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="backup-page">

      <div className="page-header">

        <h1>
          Backup & Restore Sistem
        </h1>

        <p>
          Backup database serta restore data tanpa replace
        </p>

      </div>

      <div className="backup-grid">

        <div className="backup-card">

          <div className="card-header">
            <h2>Backup Database</h2>
          </div>

          <div className="form-group">

            <label>Nama Backup</label>

            <input
              type="text"
              value={backupName}
              onChange={(e)=>setBackupName(e.target.value)}
              placeholder="Backup Juli 2026"
            />

          </div>

          <div className="form-group">

            <label>Keterangan</label>

            <textarea
              value={description}
              onChange={(e)=>setDescription(e.target.value)}
              placeholder="Opsional"
            />

          </div>

          <button
            className="btn-primary"
            onClick={handleBackup}
            disabled={loading}
          >

            {loading ? "Membuat Backup..." : "Backup Sekarang"}

          </button>

        </div>

        <div className="backup-card">

          <div className="card-header">

            <h2>Restore Database</h2>

          </div>

          <div className="form-group">

            <label>Pilih File SQL</label>

            <input
              type="file"
              accept=".sql"
              onChange={(e)=>setFile(e.target.files[0])}
            />

          </div>

          <button
            className="btn-success"
            disabled={restoreLoading}
            onClick={handleRestore}
          >

            {restoreLoading ? "Restore..." : "Restore Database"}

          </button>

        </div>

      </div>

      <div className="history-card">

        <div className="card-header">

          <h2>Riwayat Backup</h2>

        </div>

        <table>

          <thead>

          <tr>

            <th>Nama</th>
            <th>Keterangan</th>
            <th>Tanggal</th>
            <th>Ukuran</th>
            <th>Aksi</th>

          </tr>

          </thead>

          <tbody>

          {history.map((item)=>(
                        <tr key={item.id}>

              <td>{item.name}</td>

              <td>{item.description}</td>

              <td>
                {new Date(item.createdAt).toLocaleString("id-ID")}
              </td>

              <td>{item.size}</td>

              <td>

                <button
                  className="btn-download"
                  onClick={()=>{
                    window.open(
                      `/api/backup/download/${item.id}`,
                      "_blank"
                    );
                  }}
                >
                  Download
                </button>

                <button
                  className="btn-warning"
                  onClick={async()=>{

                    const ok = window.confirm(
                      "Restore database ini?"
                    );

                    if(!ok) return;

                    try{

                      setRestoreLoading(true);

                      await axios.post(
                        `/api/restore/${item.id}`
                      );

                      alert("Restore berhasil");

                    }catch(err){

                      alert("Restore gagal");

                    }finally{

                      setRestoreLoading(false);

                    }

                  }}
                >
                  Restore
                </button>

                <button
                  className="btn-danger"
                  onClick={async()=>{

                    const ok = window.confirm(
                      "Hapus backup ini?"
                    );

                    if(!ok) return;

                    try{

                      await axios.delete(
                        `/api/backup/${item.id}`
                      );

                      loadHistory();

                    }catch(err){

                      alert("Gagal menghapus backup");

                    }

                  }}
                >
                  Hapus
                </button>

              </td>

            </tr>

          ))}

          {history.length===0 && (

            <tr>

              <td
                colSpan={5}
                style={{
                  textAlign:"center",
                  padding:"40px"
                }}
              >
                Belum ada backup.
              </td>

            </tr>

          )}

          </tbody>

        </table>

      </div>

    </div>
  );

}z