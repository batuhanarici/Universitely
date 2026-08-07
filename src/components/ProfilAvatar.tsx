import { avatarPublicUrl } from "../lib/avatarQueries";

const RENKLER = ["#0F1B2D", "#8A6D3B", "#2A9D8F", "#5B6E8C", "#A35A3C", "#6B5B95"];

function avatarRengi(tohum: string): string {
  let h = 0;
  for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) % 997;
  return RENKLER[h % RENKLER.length];
}

function avatarBasHarfler(adSoyad: string): string {
  const kelimeler = adSoyad.trim().split(/\s+/).filter(Boolean);
  if (kelimeler.length === 0) return "?";
  if (kelimeler.length === 1) return kelimeler[0].slice(0, 2).toLocaleUpperCase("tr");
  return (kelimeler[0][0] + kelimeler[kelimeler.length - 1][0]).toLocaleUpperCase("tr");
}

export default function ProfilAvatar({ adSoyad, tohum, yol, boyut = 40 }: {
  adSoyad: string;
  tohum: string;
  yol: string | null | undefined;
  boyut?: number;
}) {
  const url = avatarPublicUrl(yol);
  const ortak = { width: boyut, height: boyut, borderRadius: "50%", flexShrink: 0 };

  if (url) {
    return <img src={url} alt={adSoyad} style={{ ...ortak, objectFit: "cover", display: "block" }} />;
  }

  return (
    <div
      style={{
        ...ortak,
        background: avatarRengi(tohum),
        color: "#F4EFE4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(boyut * 0.4),
        fontWeight: 700,
        letterSpacing: "0.02em",
      }}
    >
      {avatarBasHarfler(adSoyad)}
    </div>
  );
}
