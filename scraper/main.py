import os.path
import logging
import io
import csv
from facebook_scraper import get_posts, enable_logging
import re
from datetime import datetime
import shutil

start_time = datetime.now()
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

latest_confession_id = 92879
print('latest_confession_id', latest_confession_id)

# enable_logging(logging.DEBUG)
i = 0
for p in get_posts('nuswhispers', pages=1000, timeout=20):
  # if i >= 30:
  #   print(p)
  match = re.match(r'^#(\d{5}\d?):', p['text'][-52:])
  if not match:
    match = re.match(r'^#(\d{5}\d?):', p['text'])
  if not match:
    print(p)
    continue
  print(i, match.group(1))
  if int(match.group(1)) == latest_confession_id:
    break
  keys = ['text','image','post_id','likes','comments','shares']
  row = [p.get(k) for k in keys]
  row.append(p['time'].isoformat())
  # keys = ['like','love','haha','wow','support','sorry','anger']
  # row.extend([p['reactions'].get(k, 0) for k in keys])
  row.append(datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'))
  csv_writer.writerow(row)
  i += 1

# csv_file has read until second line after confession id, append confession id to buffer, and append rest of csv_file to buffer
if os.path.isfile('data.csv'):
  buf.write(start)
  shutil.copyfileobj(csv_file, buf)

# write buffer over csv file
with open('data.csv', 'w') as fd:
  buf.seek(0)
  shutil.copyfileobj(buf, fd)

print('time elapsed', str(datetime.now() - start_time))

#12345: https://www.nuswhispers.com/confession/12345