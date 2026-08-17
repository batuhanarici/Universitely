import { supabase } from "../lib/supabase";
import { Card, Btn } from "../components/ui";

export default function HesapAskida({ neden }: { neden: string | null }) {
  return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F4EFE4", padding: 24 }}>
    <Card style={{ maxWidth: 480, textAlign: "center", padding: 32 }}>
      <div style={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: "50%", background: "rgba(196,80,58,0.12)", color: "#C4503A", fontSize: 24, margin: "0 auto 16px" }}>!</div>
      <h1 style={{ fontFamily: "var(--font-display)", color: "#16283F", fontSize: 25, marginBottom: 10 }}>Hesabın geçici olarak askıya alındı</h1>
      <p style={{ color: "rgba(15,27,45,0.62)", lineHeight: 1.6, fontSize: 14 }}>Hesabınla uygulamadaki panellere şu anda erişemezsin. Ayrıntı için Universitely yöneticisiyle iletişime geçebilirsin.</p>
      {neden && <p style={{ padding: 12, background: "rgba(196,80,58,0.07)", borderRadius: 8, color: "#C4503A", fontSize: 13, margin: "16px 0" }}><strong>Not:</strong> {neden}</p>}
      <Btn variant="ghost" onClick={() => void supabase.auth.signOut()}>Çıkış yap</Btn>
    </Card>
  </div>;
}
