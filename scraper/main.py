import sys
import os.path
import logging
import io
import csv
from concurrent.futures import ThreadPoolExecutor, as_completed
from facebook_scraper import _scraper, get_posts, enable_logging, extractors
import re
from datetime import datetime
import shutil
import queue
import threading
import os

# enable_logging(logging.DEBUG)
# print(dir(_scraper))
# for page in get_posts('nuswhispers', pages=2, timeout=20):
#   for elem in page:
#     post = extractors.extract_post(elem, options={'account': 'nuswhispers', 'reactions': False, 'youtube_dl': False}, request_fn=_scraper.get)
#     print(post['post_id'])
# exit(0)
start_time = datetime.now()

# todo: multithread the scraping process
# todo: download latest csv file and scrape until 100 consecutive posts without change in comments/likes/shares
# https://github.com/davidchoo12/nuswhispers-analysis/releases/latest/download/data.csv
# todo: add logging to logs.txt

buf = io.StringIO()
if os.path.isfile('data.csv'):
  csv_file = open('data.csv', 'r')
  # skip csv header line
  csv_file.readline()
  # read latest confession id
  start = csv_file.read(9)
  match = re.search(r'#(\d{5}\d?):', start)

csv_writer = csv.writer(buf, delimiter=',')

# cols = ['confession_id', 'content', 'images', 'status', 'views', 'created_at', 'updated_at', 'status_updated_at', 'fb_post_id', 'fb_like_count', 'fb_comment_count', 'fingerprint', 'status_updated_at_timestamp', 'categories', 'scraped_at']
cols = ['text', 'image', 'post_id', 'likes', 'comments', 'shares', 'post_time', 'scraped_at']
# if csv_file.tell() == 0:
csv_writer.writerow(cols)

latest_confession_id = 92879 # last is 92865
print('latest_confession_id', latest_confession_id)

# enable_logging(logging.DEBUG)

_scraper.login(email=os.environ['FB_EMAIL'], password=os.environ['FB_PASS'])
q = queue.Queue()
running = True
latest_seqno = 0
def producer(q):
  global running
  i = 0
  for page in get_posts('nuswhispers', pages=100000, timeout=20):
    if running:
      for elem in page:
        # print('  producing', i)
        q.put((i, elem))
        print('  produced', i)
        i += 1
    else:
      break
  print('producing False')
  q.put(False)
  # print(posts)
  # return posts

rowsq = queue.Queue()
def consumer(q, threadno):
  global running, latest_seqno, rowsq
  extracted = []
  # print(threadno, 'consumer')
  try:
    while task := q.get(timeout=2):
      i, elem = task
      if not running:
        print('stopping', threadno, 'at', i)
        break
      # print(threadno, 'extracting', i)
      p = extractors.extract_post(elem, options={'account': 'nuswhispers', 'reactions': False, 'youtube_dl': False}, request_fn=_scraper.get)
      print(threadno, 'extracted', i)
      extracted.append(i)
      # print('consuming', i)
      match = re.match(r'^#(\d{5}\d?):', p['text'][-52:])
      if not match:
        # print('first no match', p['text'])
        match = re.match(r'^#(\d{5}\d?):', p['text'])
      if not match:
        print('no match, post_id=', 'https://www.facebook.com/nuswhispers/posts/'+p['post_id'])
        print(p['text'])
        continue
      # print(threadno, 'consuming', i, match.group(1))
      # if int(match.group(1)) == latest_confession_id:
      #   print('found latest', i, 'stopping...')
      #   running = False
      #   latest_seqno = i
      #   break
      row = [i]
      keys = ['text','image','post_id','likes','comments','shares']
      row.extend([p.get(k) for k in keys])
      row.append(p['time'].isoformat())
      # keys = ['like','love','haha','wow','support','sorry','anger']
      # row.extend([p['reactions'].get(k, 0) for k in keys])
      row.append(datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'))
      rowsq.put(row)
      # print('rowsq size', rowsq.qsize())
      # csv_writer.writerow(row)
  except queue.Empty as e:
    print(threadno, 'queue empty timed out')
  finally:
    print(threadno, 'stopped, extracted', extracted)

with ThreadPoolExecutor(max_workers=5) as executor:
  executor.submit(producer, q)
  executor.submit(consumer, q, 0)
  executor.submit(consumer, q, 1)
  executor.submit(consumer, q, 2)
  executor.submit(consumer, q, 3)

print('outside rowsq size', rowsq.qsize())
rows = list(rowsq.queue)
print('rows len', len(rows))
rows.sort(key=lambda e: e[0])
for row in rows:
  # print(row[0])
  csv_writer.writerow(row)

# with ThreadPoolExecutor(max_workers=2) as executor:

# start = 0
# with ThreadPoolExecutor() as executor:
#   # while start < 2:
#   data = []
#   futures_to_step = {executor.submit(scrape): step for step in range(0, 2)}
#   step_to_result = {}
#   for future in as_completed(futures_to_step):
#     step = futures_to_step[future]
#     step_to_result[step] = future.result()
#   # for [step, result] in sorted(step_to_result.items()):
#   #   data.extend(result)
#   # save(data)
#   print(step_to_result)
#   start += executor._max_workers
#   print(start)
#   # if data == []:
#   #   break

# i = 0
# for p in get_posts('nuswhispers', pages=1000, timeout=20):
#   # if i >= 30:
#   #   print(p)
#   match = re.match(r'^#(\d{5}\d?):', p['text'][-52:])
#   if not match:
#     match = re.match(r'^#(\d{5}\d?):', p['text'])
#   if not match:
#     print(p)
#     continue
#   print(i, match.group(1))
#   if int(match.group(1)) == latest_confession_id:
#     break
#   keys = ['text','image','post_id','likes','comments','shares']
#   row = [p.get(k) for k in keys]
#   row.append(p['time'].isoformat())
#   # keys = ['like','love','haha','wow','support','sorry','anger']
#   # row.extend([p['reactions'].get(k, 0) for k in keys])
#   row.append(datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'))
#   csv_writer.writerow(row)
#   i += 1

# # csv_file has read until second line after confession id, append confession id to buffer, and append rest of csv_file to buffer
# if os.path.isfile('data.csv'):
#   buf.write(start)
#   shutil.copyfileobj(csv_file, buf)

# write buffer over csv file
with open('data.csv', 'w') as fd:
  buf.seek(0)
  shutil.copyfileobj(buf, fd)

print('time elapsed', str(datetime.now() - start_time))

#12345: https://www.nuswhispers.com/confession/12345