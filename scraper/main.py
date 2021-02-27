import sys
import os.path
import logging
import io
import csv
from concurrent.futures import ThreadPoolExecutor, as_completed
from facebook_scraper import _scraper, get_posts, enable_logging, extractors
import re
from datetime import datetime, timezone
import shutil
import queue
import threading
import os

log_format = '%(relativeCreated)8d %(threadName)3s %(message)s'
logging.basicConfig(level=logging.DEBUG, format=log_format)
file_handler = logging.FileHandler('logs.txt', 'w')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(logging.Formatter(log_format))
logger = logging.getLogger()
logger.addHandler(file_handler)
threading.current_thread().name = 'M'

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
cols = ['no', 'text', 'image', 'post_id', 'likes', 'comments', 'shares', 'post_time', 'scraped_at']
# if csv_file.tell() == 0:
csv_writer.writerow(cols)

latest_confession_id = 92879 # last is 92865
logger.info('latest_confession_id %d', latest_confession_id)

enable_logging(logging.DEBUG)

# _scraper.login(email=os.environ['FB_EMAIL'], password=os.environ['FB_PASS'])
q = queue.Queue()
running = True
latest_seqno = 0
def producer(q):
  global running
  i = 0
  for page, shares in get_posts('nuswhispers', pages=100000, timeout=20):
    if running:
      for elem, share in zip(page, shares):
        # print('  producing', i)
        q.put((i, elem, share))
        logger.info('  produced %d', i)
        i += 1
    else:
      break
  logger.info('producing False')
  q.put(False)
  # print(posts)
  # return posts

rowsq = queue.Queue()
def consumer(q, threadno):
  global running, latest_seqno, rowsq
  extracted = []
  # print(threadno, 'consumer')
  try:
    while task := q.get(timeout=10):
      i, elem, share = task
      if not running:
        logger.info('stopping %d at %d', threadno, i)
        break
      logger.info('%d extracting %d', threadno, i)
      p = extractors.extract_post(elem, options={'account': 'nuswhispers', 'reactions': False, 'youtube_dl': False}, request_fn=_scraper.get)
      logger.info('%d extracted %d', threadno, i)
      # print('consuming', i)
      match = re.match(r'^#(\d{5}\d?):', p['text'][-52:])
      if not match:
        # print('first no match', p['text'])
        match = re.match(r'^#(\d{5}\d?):', p['text'])
      if not match:
        logger.info('no match, post_id=https://www.facebook.com/nuswhispers/posts/%s', p['post_id'])
        logger.info(p['source'].html)
        continue
      logger.info('%d consuming %d %s', threadno, i, match.group(1))
      # if int(match.group(1)) == latest_confession_id:
      #   print('found latest', i, 'stopping...')
      #   running = False
      #   latest_seqno = i
      #   break
      row = [i]
      keys = ['text','image','post_id','likes','comments']
      row.extend([p.get(k) for k in keys])
      row.append(share)
      logger.info('time %s', p.get('time'))
      # logger.info('time iso %s', p.get('time').astimezone().astimezone(timezone.utc).isoformat(timespec='seconds'))
      row.append(p.get('time').astimezone().astimezone(timezone.utc).isoformat(timespec='seconds'))
      # keys = ['like','love','haha','wow','support','sorry','anger']
      # row.extend([p['reactions'].get(k, 0) for k in keys])
      row.append(datetime.utcnow().astimezone(timezone.utc).isoformat(timespec='seconds'))
      rowsq.put(row)
      extracted.append(i)
      logger.info('rowsq size %d', rowsq.qsize())
      # csv_writer.writerow(row)
  except queue.Empty as e:
    logger.info('%d queue empty timed out', threadno)
  finally:
    logger.info('%d stopped, extracted %s', threadno, str(extracted))

with ThreadPoolExecutor(thread_name_prefix='T') as executor:
  executor.submit(producer, q)
  for i in range(executor._max_workers - 1):
    executor.submit(consumer, q, i)

logger.info('outside rowsq size %d', rowsq.qsize())
rows = list(rowsq.queue)
logger.info('rows len %d', len(rows))
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

logger.info('time elapsed %s', str(datetime.now() - start_time))

#12345: https://www.nuswhispers.com/confession/12345