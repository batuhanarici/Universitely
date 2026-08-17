import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card } from "../../components/ui";
import { useVeliVeri } from "./veliContext";
import { useVeliDerived } from "./veliDerived";

const tt = { contentStyle: { background: "#0F1B2D", border: "none", borderRadius: 8, color: "#F4EFE4", fontSize: 12 } };

export default function Grafikler() {
  const { yukleniyor } = useVeliVeri();
  const d = useVeliDerived();

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  const netData = d.denemeler.map((e, i) => ({ name: (e.ad.replace(/Denemesi\s*/i, "#") || `#${i + 1}`), net: e.net }));

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Grafikler</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Çocuğunuzun performans grafikleri</p>
      </div>

      <Card className="tape-accent">
        <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Net Grafiği</h3>
        {d.denemeler.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Henüz deneme sonucu yok.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={netData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,27,45,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "rgba(15,27,45,0.4)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "rgba(15,27,45,0.4)" }} axisLine={false} tickLine={false} />
              <Tooltip {...tt} />
              <Line type="monotone" dataKey="net" stroke="#E4BB60" strokeWidth={2.5} dot={{ r: 4, fill: "#E4BB60", stroke: "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Ders Başarı Yüzdeleri</h3>
        {d.dersler.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Henüz ders bazlı veri yok.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.dersler} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,27,45,0.06)" />
              <XAxis dataKey="ad" tick={{ fontSize: 10, fill: "rgba(15,27,45,0.4)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "rgba(15,27,45,0.4)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip {...tt} />
              <Bar dataKey="yuzde" name="Başarı %" fill="#2A9D8F" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Son 14 Gün Çalışma</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={d.son14Gun} barSize={20} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,27,45,0.06)" />
            <XAxis dataKey="kisa" tick={{ fontSize: 10, fill: "rgba(15,27,45,0.4)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "rgba(15,27,45,0.4)" }} axisLine={false} tickLine={false} />
            <Tooltip {...tt} />
            <Bar dataKey="sure" name="Süre (dk)" fill="#0F1B2D" radius={[2, 2, 0, 0]} />
            <Bar dataKey="soru" name="Soru" fill="#E4BB60" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
