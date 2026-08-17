import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { coachNav, parentNav, studentNav, type NavGroup } from './navigation';
import ProfilAvatarMenu from './ProfilAvatarMenu';
import BildirimCani from './BildirimCani';


function SidebarContent({ navConfig, roleLabel, activePath, onNavigate }: {
  navConfig: NavGroup[]; roleLabel: string; activePath: string; onNavigate: (path: string) => void;
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: '#fff', borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
            <img src="/icon.svg" alt="Universitely" style={{ width: 30, height: 30, objectFit: 'cover' }} />
          </div>
          <div className="sidebar-brand-copy">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: '#F4EFE4', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Universitely
            </div>
            <div style={{ fontSize: 10, color: 'rgba(244,239,228,0.4)', marginTop: 2, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {roleLabel}
            </div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {navConfig.map(group => (
          <div key={group.group} data-tur-grup={group.group}>
            <div className="sidebar-label">{group.group}</div>
            {group.items.map(item => (
              <a
                key={item.path}
                className={`sidebar-item ${activePath === item.path ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); onNavigate(item.path); }}
                href={item.path}
                title={item.label}
                data-tur-oge={item.label}
              >
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
}

// ── Panel layouts (router-free: driven by activePath + onNavigate) ─────────
export function PanelLayout({ navConfig, roleLabel, activePath, onNavigate, onProfilAcil, onAyarlarAcil, yardimAcik, onYardimToggle, children }: {
  navConfig: NavGroup[]; roleLabel: string; activePath: string; onNavigate: (p: string) => void; onProfilAcil?: () => void; onAyarlarAcil?: () => void; yardimAcik?: boolean; onYardimToggle?: () => void; children: ReactNode;
}) {
  return (
    <div className="panel-layout">
      <SidebarContent navConfig={navConfig} roleLabel={roleLabel} activePath={activePath} onNavigate={onNavigate} />
      <main className={`panel-main${onProfilAcil ? " panel-main-with-profile" : ""}`}>
        {onProfilAcil && (
          <div className="panel-profile-bar">
            {onYardimToggle && (
              <button
                type="button"
                onClick={onYardimToggle}
                aria-label="Yardım"
                title="Yardım"
                style={{
                  border: "none",
                  background: yardimAcik ? "rgba(228,187,96,0.15)" : "none",
                  padding: 6,
                  cursor: "pointer",
                  borderRadius: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0F1B2D",
                }}
              >
                <Icon name="help" size={19} />
              </button>
            )}
            <BildirimCani onNavigate={onNavigate} />
            <ProfilAvatarMenu onProfilAcil={onProfilAcil} onAyarlarAcil={onAyarlarAcil} />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

export function StudentLayout({ activePath, onNavigate, onProfilAcil, onAyarlarAcil, yardimAcik, onYardimToggle, children }: {
  activePath: string; onNavigate: (p: string) => void; onProfilAcil?: () => void; onAyarlarAcil?: () => void; yardimAcik?: boolean; onYardimToggle?: () => void; children: ReactNode;
}) {
  return <PanelLayout navConfig={studentNav} roleLabel="Öğrenci Paneli" activePath={activePath} onNavigate={onNavigate} onProfilAcil={onProfilAcil} onAyarlarAcil={onAyarlarAcil} yardimAcik={yardimAcik} onYardimToggle={onYardimToggle}>{children}</PanelLayout>;
}

export function CoachLayout({ activePath, onNavigate, onProfilAcil, onAyarlarAcil, children }: {
  activePath: string; onNavigate: (p: string) => void; onProfilAcil?: () => void; onAyarlarAcil?: () => void; children: ReactNode;
}) {
  return <PanelLayout navConfig={coachNav} roleLabel="Koç Paneli" activePath={activePath} onNavigate={onNavigate} onProfilAcil={onProfilAcil} onAyarlarAcil={onAyarlarAcil}>{children}</PanelLayout>;
}

export function ParentLayout({ activePath, onNavigate, onProfilAcil, onAyarlarAcil, yardimAcik, onYardimToggle, children }: {
  activePath: string; onNavigate: (p: string) => void; onProfilAcil?: () => void; onAyarlarAcil?: () => void; yardimAcik?: boolean; onYardimToggle?: () => void; children: ReactNode;
}) {
  return <PanelLayout navConfig={parentNav} roleLabel="Veli Paneli" activePath={activePath} onNavigate={onNavigate} onProfilAcil={onProfilAcil} onAyarlarAcil={onAyarlarAcil} yardimAcik={yardimAcik} onYardimToggle={onYardimToggle}>{children}</PanelLayout>;
}
