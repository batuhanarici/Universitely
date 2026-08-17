import json
import re
from pathlib import Path

INPUT = Path('/home/ubuntu/Universitely/data/2026-yks-kontenjan-kilavuzu.txt')
OUTPUT = Path('/home/ubuntu/Universitely/public/data/yks-2026-programlari.json')

text = INPUT.read_text(errors='ignore')
lines = text.splitlines()

start = next((i for i, line in enumerate(lines) if 'TABLO-3.' in line), 0)
end = next((i for i, line in enumerate(lines[start:], start) if "TABLO 3 VE TABLO 4'TE YER ALAN" in line), len(lines))
table4_start = next((i for i, line in enumerate(lines[start:end], start) if 'TABLO-4.' in line), end)

programs = []
current_university = ''
seen_codes = set()

code_re = re.compile(r'^\s*(\d{9})\s+(.*)$')
row_re = re.compile(r'\s+(\d+)\s+(TYT|SAY|SÖZ|EA|DİL|YDT)\s+')
last_pair_re = re.compile(r'(\d{3,8}|\.\.\.)\s+(\d{3}\.\d{5}|----)(?:\s|$)')

for index, line in enumerate(lines[start:end]):
    absolute_index = start + index
    stripped = ' '.join(line.strip().split())
    if not stripped:
        continue
    if 'ÜNİVERSİTESİ' in stripped and 'TABLO' not in stripped and not stripped.startswith('YÜKSEKÖĞRETİM PROGRAMLARI'):
        current_university = stripped

    code_match = code_re.match(line)
    if not code_match:
        continue
    code, rest = code_match.groups()
    if code in seen_codes:
        continue
    row_match = row_re.search(rest)
    if not row_match:
        continue
    name = ' '.join(rest[:row_match.start()].strip().split())
    if not name or name.startswith(('PROGRAM', 'KODU')):
        continue

    duration = int(row_match.group(1))
    point_type = row_match.group(2)
    tail = rest[row_match.end():]
    quota_match = re.match(r'\s*(\d+)', tail)
    quota = int(quota_match.group(1)) if quota_match else None
    last_pairs = list(last_pair_re.finditer(rest))
    rank = None
    score = None
    if last_pairs:
        rank_text, score_text = last_pairs[-1].groups()
        rank = int(rank_text) if rank_text.isdigit() else None
        score = float(score_text) if score_text != '----' else None

    university_type = None
    if 'Vakıf Üniversitesi' in current_university:
        university_type = 'vakif'
    elif 'Devlet Üniversitesi' in current_university:
        university_type = 'devlet'

    seen_codes.add(code)
    programs.append({
        'kod': code,
        'ad': name,
        'universite': current_university or None,
        'universiteTuru': university_type,
        'tur': 'onlisans' if absolute_index < table4_start else 'lisans',
        'sure': duration,
        'puanTuru': point_type,
        'kontenjan': quota,
        '2025BasariSirasi': rank,
        '2025EnKucukPuan': score,
        'kaynakYil': 2026,
        'gecmisVeriYili': 2025,
    })

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps({'source': 'ÖSYM 2026-YKS kılavuzu', 'sourceUrl': 'https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/TERCIH/kontkilavuz_yktd21072026.pdf', 'generatedAt': '2026-08-17', 'programlar': programs}, ensure_ascii=False, separators=(',', ':')))
print({'table_start': start, 'table4_start': table4_start, 'end': end, 'program_count': len(programs), 'with_rank': sum(1 for p in programs if p['2025BasariSirasi'] is not None), 'with_score': sum(1 for p in programs if p['2025EnKucukPuan'] is not None)})
