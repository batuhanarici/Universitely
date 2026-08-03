import { useState } from "react";
import { supabase } from "../../lib/supabase";
import UYArrow from "../../components/UYArrow";
import Dashboard from "./Dashboard";
import Profil from "./Profil";
import Calisma from "./Calisma";
import Konular from "./Konular";
import Gorevler from "./Gorevler";

type Sekme = "dashboard" | "profil" | "calisma" | "konular" | "gorevler";

interface SekmeTanimi {
  id: Sekme;
  etiket: string;
  icon: string;
}

const GRUPLAR: { grup: string; sekmeler: SekmeTanimi[] }[] = [
  {
    grup: "Genel",
    sekmeler: [
      { id: "dashboard", etiket: "Günlük", icon: "📊" },
      { id: "profil", etiket: "Profil", icon: "🎯" },
    ],
  },
  {
    grup: "Çalışma",
    sekmeler: [
      { id: "calisma", etiket: "Çalışma", icon: "⏱️" },
      { id: "konular", etiket: "Konular", icon: "📚" },
      { id: "gorevler", etiket: "Görevler", icon: "✅" },
    ],
  },
];

export default function OgrenciPaneli() {
  const [sekme, setSekme] = useState<Sekme>("dashboard");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="mark"><UYArrow size={20} color="#E4BB60" /></span>
          <span className="sidebar-logo-text">Universitely</span>
        </div>
        <nav className="sidebar-nav">
          {GRUPLAR.map((g) => (
            <div key={g.grup}>
              <p className="sidebar-grup">{g.grup}</p>
              {g.sekmeler.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSekme(s.id)}
                  className={`sidebar-item${sekme === s.id ? " active" : ""}`}
                >
                  <span>{s.icon}</span>
                  <span>{s.etiket}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={() => supabase.auth.signOut()}>Çıkış Yap</button>
        </div>
      </aside>
      <main className="main-area">
        {sekme === "dashboard" && <Dashboard />}
        {sekme === "profil" && <Profil />}
        {sekme === "calisma" && <Calisma />}
        {sekme === "konular" && <Konular />}
        {sekme === "gorevler" && <Gorevler />}
      </main>
    </div>
  );
}
