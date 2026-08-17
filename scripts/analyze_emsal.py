import csv
from collections import Counter
from pathlib import Path

path = Path('/home/ubuntu/Universitely/emsal-ozellik-matrisi.csv')
rows = list(csv.DictReader(path.open(encoding='utf-8')))
features = [key for key in rows[0] if key != 'ürün']
print('ÖZELLİK;ÜRÜN_SAYISI;UNIVERSITELY_DURUMU')
for feature in features:
    count = sum(1 for row in rows if row[feature] in {'var', 'yüksek'})
    univers = next(row[feature] for row in rows if row['ürün'] == 'Universitely')
    print(f'{feature};{count};{univers}')
print('\nUNIVERSITELY_EKSIK_EMSAL_SAYISI')
for feature in features:
    univers = next(row[feature] for row in rows if row['ürün'] == 'Universitely')
    if univers in {'yok', 'kısmen'}:
        count = sum(1 for row in rows if row[feature] in {'var', 'yüksek'})
        print(f'{feature};{count}')

print('\nURUN_BAZLI_VAR_SAYISI')
for row in rows:
    print(f"{row['ürün']};{sum(value in {'var', 'yüksek'} for key, value in row.items() if key != 'ürün')}")
