import type { IconName } from "./Icon";

export interface NavItem { path: string; label: string; icon: IconName }
export interface NavGroup { group: string; items: NavItem[] }

export const studentNav: NavGroup[] = [
  { group: "Genel", items: [
    { path: "/student/dashboard", label: "Bugün", icon: "home" },
  ] },
  { group: "Çalışma", items: [
    { path: "/student/study", label: "Çalışma", icon: "pen" },
    { path: "/student/tasks", label: "Görevler", icon: "task" },
    { path: "/student/calendar", label: "Takvim", icon: "calendar" },
    { path: "/student/subjects", label: "Konular", icon: "book" },
    { path: "/student/resources", label: "Kaynaklar", icon: "resource" },
  ] },
  { group: "Ölçme & Tekrar", items: [
    { path: "/student/exams", label: "Denemeler", icon: "folder" },
    { path: "/student/analysis", label: "Analiz", icon: "chart" },
    { path: "/student/wrongs", label: "Yanlışlar", icon: "x" },
    { path: "/student/repetition", label: "Tekrar Planı", icon: "repeat" },
    { path: "/student/compare", label: "Karşılaştırma", icon: "compare" },
  ] },
  { group: "Koç & Sistem", items: [
    { path: "/student/ai-coach", label: "AI Koçum", icon: "ai" },
    { path: "/student/weekly-report", label: "Haftalık Rapor", icon: "report" },
    { path: "/student/motivation", label: "Motivasyon", icon: "medal" },
    { path: "/student/messages", label: "Mesajlar", icon: "message" },
    { path: "/student/notifications", label: "Bildirimler", icon: "bell" },
  ] },
];

export const coachNav: NavGroup[] = [
  { group: "Genel", items: [
    { path: "/coach/dashboard", label: "Dashboard", icon: "home" },
    { path: "/coach/risk", label: "AI Risk", icon: "alert" },
    { path: "/coach/accounting", label: "Muhasebe", icon: "money" },
  ] },
  { group: "Sınıf", items: [
    { path: "/coach/class-overview", label: "Sınıf Genel", icon: "chart" },
    { path: "/coach/class-analysis", label: "Sınıf Analiz", icon: "grid" },
    { path: "/coach/students", label: "Öğrenciler", icon: "students" },
    { path: "/coach/weekly-program", label: "Haftalık Program", icon: "calendar" },
    { path: "/coach/lesson-calendar", label: "Ders Takvimi", icon: "calendar" },
  ] },
  { group: "Atama", items: [
    { path: "/coach/task-management", label: "Görev Yönetimi", icon: "task" },
    { path: "/coach/assign-resource", label: "Kaynak Ata", icon: "resource" },
    { path: "/coach/assign-subject", label: "Konu Ata", icon: "book" },
    { path: "/coach/lesson-management", label: "Ders/Konu", icon: "template" },
  ] },
  { group: "Denemeler", items: [
    { path: "/coach/exam-template", label: "Deneme Şablonu", icon: "template" },
    { path: "/coach/create-exam", label: "Deneme Oluştur", icon: "plus" },
    { path: "/coach/enter-result", label: "Sonuç Gir", icon: "check" },
    { path: "/coach/bulk-result", label: "Toplu Sonuç", icon: "grid" },
  ] },
  { group: "İletişim", items: [
    { path: "/coach/messages", label: "Mesajlar", icon: "message" },
    { path: "/coach/notifications", label: "Bildirimler", icon: "bell" },
    { path: "/coach/notes", label: "Koç Notları", icon: "note" },
    { path: "/coach/meetings", label: "Görüşme & Ödeme", icon: "meeting" },
    { path: "/coach/bulk-notify", label: "Toplu Bildirim", icon: "send" },
    { path: "/coach/class-report", label: "Sınıf Raporu", icon: "report" },
  ] },
];

export const parentNav: NavGroup[] = [
  { group: "Çocuğum", items: [
    { path: "/parent/overview", label: "Genel Durum", icon: "home" },
    { path: "/parent/charts", label: "Grafikler", icon: "chart" },
    { path: "/parent/calendar", label: "Takvim", icon: "calendar" },
    { path: "/parent/notifications", label: "Bildirimler", icon: "bell" },
    { path: "/parent/report", label: "Rapor", icon: "report" },
    { path: "/parent/ai-summary", label: "AI Özet", icon: "ai" },
    { path: "/parent/message", label: "Koça Mesaj", icon: "message" },
  ] },
];
