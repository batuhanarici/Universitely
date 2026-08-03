import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hata: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hata: null };

  static getDerivedStateFromError(error: unknown): State {
    return { hata: error instanceof Error ? error.message : "Bilinmeyen bir hata" };
  }

  render() {
    if (this.state.hata) {
      return (
        <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 460, borderLeft: "4px solid var(--yanlis)" }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--yanlis)", marginBottom: 8 }}>
              Görüntülenirken bir şeyler ters gitti
            </p>
            <p className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>{this.state.hata}</p>
            <button onClick={() => this.setState({ hata: null })} className="btn btn-primary" style={{ marginTop: 14 }}>
              Tekrar Dene
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}