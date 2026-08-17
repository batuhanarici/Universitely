import csv
from pathlib import Path

path = Path('/home/ubuntu/Universitely/emsal-onceliklendirme.csv')
rows = list(csv.DictReader(path.open(encoding='utf-8')))
for row in rows:
    value = int(row['kullanıcı_değeri'])
    diff = int(row['farklılaşma'])
    urgency = int(row['aciliyet'])
    complexity = int(row['teknik_zorluk'])
    row['skor'] = round((value * 2 + diff + urgency) / complexity, 2)
for row in sorted(rows, key=lambda item: float(item['skor']), reverse=True):
    print(f"{row['skor']};{row['önerilen_faz']};{row['özellik']}")
