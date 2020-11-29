from urllib.request import Request, urlopen
import json
import csv
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import traceback

count = 10
def request(step):
  tries = 3
  while tries > 0:
    tries -= 1
    try:
      offset = count * step
      req = Request('https://www.nuswhispers.com/api/confessions/recent?count={}&offset={}'.format(count, offset))
      req.add_header('User-Agent', '')
      with urlopen(req) as conn:
        data = json.loads(conn.read().decode('utf8'))
        return data['data']['confessions']
    except:
      pass

json_file = open('data.json', 'ab+')
csv_file = open('data.csv', 'a')
csv_writer = csv.writer(csv_file, delimiter=',')
error_logs = open('error.txt', 'w')

def save(data):
  data_str = json.dumps(data, separators=(',', ':'))
  # append to json without reading it first, src: https://stackoverflow.com/a/44599922/4858751
  if json_file.tell() == 0:
    json_file.write(data_str.encode())
  elif data:
    json_file.seek(-1, 2) # seek to last char
    json_file.truncate() # remove ]
    json_file.write(','.encode()) # add ,
    json_file.write(data_str[1:].encode()) # add new data except first [

  cols = ['confession_id', 'content', 'images', 'status', 'views', 'created_at', 'updated_at', 'status_updated_at', 'fb_post_id', 'fb_like_count', 'fb_comment_count', 'fingerprint', 'status_updated_at_timestamp', 'categories', 'scraped_at']
  if csv_file.tell() == 0:
    csv_writer.writerow(cols)
  # rows = [[d[col] for col in cols] for d in data]
  for d in data:
    row = []
    for col in cols[0:9]: # confession_id to fb_post_id
      row.append(d[col])
    try:
      row.append(d['facebook_information']['likes']['summary']['total_count']) # fb_like_count
      row.append(d['facebook_information']['comments']['summary']['total_count']) # fb_comment_count
    except Exception:
      row.append(0)
      row.append(0)
      error_logs.write('{}\n{}\n'.format(d['confession_id'], traceback.format_exc()))
    for col in cols[11:13]: # fingerprint to status_updated_at_timestamp
      row.append(d[col])
    row.append(','.join(cat.get('confession_category') for cat in d['categories'])) # categories
    row.append(datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')) # scraped_at
    csv_writer.writerow(row)

# offset = 0
# count = 10
# i = 0
start = 0
with ThreadPoolExecutor() as executor:
  while True:
    data = []
    futures_to_step = {executor.submit(request, step): step for step in range(start, start + executor._max_workers)}
    step_to_result = {}
    for future in as_completed(futures_to_step):
      step = futures_to_step[future]
      step_to_result[step] = future.result()
    for [step, result] in sorted(step_to_result.items()):
      data.extend(result)
    save(data)
    start += executor._max_workers
    if data == []:
      break

# while True:



  # offset += count
  # if len(data) == 0:
  #   break

# confessions has many comments, likes
# users has many comments, likes
