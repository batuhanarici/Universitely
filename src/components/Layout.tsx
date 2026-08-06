import type { ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';

// ── Sidebar nav config ──────────────────────────────────────────────────────
export interface NavItem { path: string; label: string; icon: IconName }
export interface NavGroup { group: string; items: NavItem[] }

export const studentNav: NavGroup[] = [
  { group: 'Genel', items: [
    { path: '/student/dashboard', label: 'Günlük', icon: 'home' },
    { path: '/student/profile', label: 'Profil', icon: 'user' },
  ]},
  { group: 'Çalışma', items: [
    { path: '/student/study', label: 'Çalışma', icon: 'pen' },
    { path: '/student/subjects', label: 'Konular', icon: 'book' },
    { path: '/student/resources', label: 'Kaynaklar', icon: 'resource' },
    { path: '/student/tasks', label: 'Görevler', icon: 'task' },
    { path: '/student/calendar', label: 'Takvim', icon: 'calendar' },
  ]},
  { group: 'Ölçme', items: [
    { path: '/student/exams', label: 'Denemeler', icon: 'folder' },
    { path: '/student/analysis', label: 'Analiz', icon: 'chart' },
    { path: '/student/wrongs', label: 'Yanlışlar', icon: 'x' },
    { path: '/student/repetition', label: 'Tekrar Planı', icon: 'repeat' },
    { path: '/student/compare', label: 'Karşılaştırma', icon: 'compare' },
  ]},
  { group: 'Koç & Sistem', items: [
    { path: '/student/ai-coach', label: 'AI Koçum', icon: 'ai' },
    { path: '/student/weekly-report', label: 'Haftalık Rapor', icon: 'report' },
    { path: '/student/motivation', label: 'Motivasyon', icon: 'medal' },
    { path: '/student/messages', label: 'Mesajlar', icon: 'message' },
    { path: '/student/notifications', label: 'Bildirimler', icon: 'bell' },
  ]},
];

export const coachNav: NavGroup[] = [
  { group: 'Genel', items: [
    { path: '/coach/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/coach/risk', label: 'AI Risk', icon: 'alert' },
    { path: '/coach/accounting', label: 'Muhasebe', icon: 'money' },
  ]},
  { group: 'Sınıf', items: [
    { path: '/coach/class-overview', label: 'Sınıf Genel', icon: 'chart' },
    { path: '/coach/class-analysis', label: 'Sınıf Analiz', icon: 'grid' },
    { path: '/coach/students', label: 'Öğrenciler', icon: 'students' },
    { path: '/coach/weekly-program', label: 'Haftalık Program', icon: 'calendar' },
  ]},
  { group: 'Atama', items: [
    { path: '/coach/task-management', label: 'Görev Yönetimi', icon: 'task' },
    { path: '/coach/assign-resource', label: 'Kaynak Ata', icon: 'resource' },
    { path: '/coach/assign-subject', label: 'Konu Ata', icon: 'book' },
    { path: '/coach/lesson-management', label: 'Ders/Konu', icon: 'template' },
  ]},
  { group: 'Denemeler', items: [
    { path: '/coach/exam-template', label: 'Deneme Şablonu', icon: 'template' },
    { path: '/coach/create-exam', label: 'Deneme Oluştur', icon: 'plus' },
    { path: '/coach/enter-result', label: 'Sonuç Gir', icon: 'check' },
    { path: '/coach/bulk-result', label: 'Toplu Sonuç', icon: 'grid' },
  ]},
  { group: 'İletişim', items: [
    { path: '/coach/messages', label: 'Mesajlar', icon: 'message' },
    { path: '/coach/notes', label: 'Koç Notları', icon: 'note' },
    { path: '/coach/meetings', label: 'Görüşme & Ödeme', icon: 'meeting' },
    { path: '/coach/bulk-notify', label: 'Toplu Bildirim', icon: 'send' },
    { path: '/coach/class-report', label: 'Sınıf Raporu', icon: 'report' },
  ]},
];

export const parentNav: NavGroup[] = [
  { group: 'Çocuğum', items: [
    { path: '/parent/overview', label: 'Genel Durum', icon: 'home' },
    { path: '/parent/charts', label: 'Grafikler', icon: 'chart' },
    { path: '/parent/calendar', label: 'Takvim', icon: 'calendar' },
    { path: '/parent/notifications', label: 'Bildirimler', icon: 'bell' },
    { path: '/parent/report', label: 'Rapor', icon: 'report' },
    { path: '/parent/ai-summary', label: 'AI Özet', icon: 'ai' },
    { path: '/parent/message', label: 'Koça Mesaj', icon: 'message' },
  ]},
];

function SidebarContent({ navConfig, roleLabel, activePath, onNavigate }: {
  navConfig: NavGroup[]; roleLabel: string; activePath: string; onNavigate: (path: string) => void;
}) {
  return (
    <div className="sidebar">
      <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid rgba(244,239,228,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: '#fff', borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
            <img src="/icon.svg" alt="Universitely" style={{ width: 30, height: 30, objectFit: 'cover' }} />
          </div>
          <div>
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
          <div key={group.group}>
            <div className="sidebar-label">{group.group}</div>
            {group.items.map(item => (
              <a
                key={item.path}
                className={`sidebar-item ${activePath === item.path ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); onNavigate(item.path); }}
                href={item.path}
              >
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(244,239,228,0.08)' }}>
        <a className="sidebar-item" onClick={(e) => { e.preventDefault(); onNavigate('/'); }} href="/">
          <Icon name="logout" size={16} />
          <span>Çıkış Yap</span>
        </a>
      </div>
    </div>
  );
}

// ── Panel layouts (router-free: driven by activePath + onNavigate) ─────────
export function PanelLayout({ navConfig, roleLabel, activePath, onNavigate, children }: {
  navConfig: NavGroup[]; roleLabel: string; activePath: string; onNavigate: (p: string) => void; children: ReactNode;
}) {
  return (
    <div className="panel-layout">
      <SidebarContent navConfig={navConfig} roleLabel={roleLabel} activePath={activePath} onNavigate={onNavigate} />
      <main className="panel-main">{children}</main>
    </div>
  );
}

export function StudentLayout({ activePath, onNavigate, children }: {
  activePath: string; onNavigate: (p: string) => void; children: ReactNode;
}) {
  return <PanelLayout navConfig={studentNav} roleLabel="Öğrenci Paneli" activePath={activePath} onNavigate={onNavigate}>{children}</PanelLayout>;
}

export function CoachLayout({ activePath, onNavigate, children }: {
  activePath: string; onNavigate: (p: string) => void; children: ReactNode;
}) {
  return <PanelLayout navConfig={coachNav} roleLabel="Koç Paneli" activePath={activePath} onNavigate={onNavigate}>{children}</PanelLayout>;
}

export function ParentLayout({ activePath, onNavigate, children }: {
  activePath: string; onNavigate: (p: string) => void; children: ReactNode;
}) {
  return <PanelLayout navConfig={parentNav} roleLabel="Veli Paneli" activePath={activePath} onNavigate={onNavigate}>{children}</PanelLayout>;
}
