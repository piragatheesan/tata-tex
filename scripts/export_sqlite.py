"""Read-only export of existing SQLite data. No passwords or users are exported."""
import sqlite3,json,sys,pathlib
if len(sys.argv)!=3:raise SystemExit('Usage: python scripts/export_sqlite.py path/to/tatatex.db export.json')
source=pathlib.Path(sys.argv[1]).resolve()
if not source.is_file():raise SystemExit('Database file does not exist.')
connection=sqlite3.connect(source.as_uri()+'?mode=ro',uri=True)
connection.row_factory=sqlite3.Row
output={}
for table in ['categories','products','enquiries']:
 rows=[dict(row) for row in connection.execute('select * from '+table+' order by id')]
 for row in rows:
  for key in ['published','emailed']:
   if key in row:row[key]=bool(row[key])
  for key in ['created_at','updated_at']:
   if key in row and row[key] and 'T' not in row[key]:row[key]=row[key].replace(' ','T')+'Z'
 output[table]=rows
pathlib.Path(sys.argv[2]).write_text(json.dumps(output,indent=2),encoding='utf-8')
connection.close()
print('Export saved. Treat it as private: it includes customer enquiries.')
