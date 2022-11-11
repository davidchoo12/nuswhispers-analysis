from typing import Union
from fastapi import FastAPI, HTTPException, Response
import re
import string
import glob
import csv
import io

app = FastAPI()

@app.get("/search")
def read_item(q: Union[str, None] = None):
  # construct query regex
  punctuation_charset = f'[{string.punctuation}]'
  sanitized_query: str = re.sub(punctuation_charset, '', q)
  if len(sanitized_query) < 3:
    raise HTTPException(status_code=400, detail="search query too short, require at least 3 chars")
  try:
    query_re = re.compile(f'\\b{sanitized_query}\\b', re.IGNORECASE)
  except:
    raise HTTPException(status_code=400, detail='fail to compile query regex')
  print('query_re', query_re)

  paths = glob.glob('scraper/data/data-0-*.csv')
  print('paths', paths)
  data_csv_path = paths[0]
  f = open(data_csv_path)
  csv_reader = csv.reader(f)

  filtered_rows = []
  for row in csv_reader:
    if len(row) == 4:
      continue
    text = row[1]
    if query_re.search(text):
      filtered_rows.append(row)
  f.close()
  print('len filtered_rows', len(filtered_rows))

  buf = io.StringIO()
  csv_writer = csv.writer(buf)
  csv_writer.writerows(filtered_rows)
  ans = buf.getvalue()
  return Response(content=ans, media_type="text/csv")