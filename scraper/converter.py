import io
import csv
import logging
from concurrent.futures import ThreadPoolExecutor
from queue import Queue, Empty
from requests_html import HTMLSession, Element, PyQuery, HTML
import threading
from datetime import datetime, timezone
import shutil
import itertools
import re
import time

# converts old data.csv scraped from nuswhispers api

# get list of fb post ids from old data.csv
# f = open('../w/data.csv')
# f2 = open('post-ids.csv', 'w')
# csv_reader = csv.reader(f)
# csv_writer = csv.writer(f2)
# for row in csv_reader:
#     content = row[1]
#     fb_post_id = row[8]
#     csv_writer.writerow([fb_post_id])

# multithread for each post id, request the story url and extract
start_time = datetime.now()
log_format = '%(relativeCreated)8d %(threadName)4s %(message)s'
logging.basicConfig(level=logging.DEBUG, format=log_format)
file_handler = logging.FileHandler('logs2.txt', 'w')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(logging.Formatter(log_format))
logger = logging.getLogger()
logger.addHandler(file_handler)
threading.current_thread().name = 'M'

ses = HTMLSession()
base_url = 'https://m.facebook.com/story.php?story_fbid=%s&id=695707917166339'
user_agent = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "Gecko/20100101 Firefox/86.0"
)
default_headers = {
    'User-Agent': user_agent,
    'Accept-Language': 'en-US,en;q=0.5'
}
ses.headers.update(default_headers)

prev_data = ses.get('https://github.com/davidchoo12/nuswhispers-analysis/releases/latest/download/data-converted.csv').text
with open('data-converted.csv', 'w') as fd:
    fd.write(prev_data)
last_no = 0
with open('data-converted.csv', 'r') as fd:
    csv_reader = csv.reader(fd)
    *_, last_row = csv_reader
    last_no = int(last_row[0])
logger.info('last no %d', last_no)

post_ids = open('post-ids.csv').readlines()[::-1]
q = Queue()
for i, pid in enumerate(post_ids[last_no+1:last_no+1000], start=last_no+1):
    q.put((i, pid))

buf = io.StringIO()
csv_writer = csv.writer(buf, delimiter=',')
# cols = ['no', 'text', 'image', 'post_id', 'likes', 'comments', 'shares', 'post_time', 'scraped_at']
# csv_writer.writerow(cols)

rowsq = Queue()
broken_url = re.compile(r'http[s]://\swww\.nuswhispers\.\scom/confession/\s(\d+)')
likes_re = re.compile(r',like_count:(\d+)')
comments_re = re.compile(r',comment_count:(\d+)')
shares_re = re.compile(r',share_count:(\d+)')
post_time_re = re.compile(r'time[^\d]+?(\d{10})[^\d]')
logger.info('my ip %s', ses.get('https://httpbin.org/ip').json()['origin'])
def scrape(q, ses):
    try:
        while task := q.get(timeout=2):
            i, pid = task
            pid = pid.rstrip()
            url = base_url % pid
            # logger.info('requesting %s', url)
            # time.sleep(2) # to avoid rate limit
            res = ses.get(url, allow_redirects=False)
            if res.is_redirect:
                logger.info('response redirect to %s', res.headers['location'])
                break
            logger.info('requested %s', url)
            # logger.info(res.html.html)
            # extract text
            elem = res.html.find('.story_body_container > div', first=True)
            text = ''
            if elem:
                text = elem.text
            elif elem := res.html.find('.hidden_elem code'):
                code = elem[0].html
                inner_html = code[code.find('<!--')+4:code.rfind('-->')].replace('</span><wbr /><span class="word_break"></span>', '')
                story_div = HTML(html=inner_html)
                text = story_div.find('.story_body_container > div, .msg > div', first=True).text
            else:
                rowsq.put([i, 'not found', None ,pid])
                logger.info('content not found for post id %s, skipping', pid)
                continue
            # if it's a post with image, the nuswhispers anchor tag contains line breaks
            text = broken_url.sub(lambda match: f'https://www.nuswhispers.com/confession/{match.group(1)}', text)
            # logger.info(text)
            # extract image
            image = res.html.find('[data-sigil="photo-image"]', first=True)
            if image:
                image = image.attrs['src']
            # logger.info('image %s', str(image))
            # extract likes
            likes = int(likes_re.search(res.html.html).group(1))
            comments = int(comments_re.search(res.html.html).group(1))
            shares = int(shares_re.search(res.html.html).group(1))
            post_time_int = int(post_time_re.search(res.html.html).group(1))
            post_time = datetime.fromtimestamp(post_time_int).astimezone().astimezone(timezone.utc).isoformat(timespec='seconds')
            # logger.info('post_time %s', post_time)
            scraped_at = datetime.utcnow().astimezone(timezone.utc).isoformat(timespec='seconds')
            row = [i, text, image, pid, likes, comments, shares, post_time, scraped_at]
            rowsq.put(row)
            logger.info('rowsq size %d', rowsq.qsize())
    except Empty as e:
        logger.info('%d queue empty timed out', threadno)
    except:
        logger.error('exception ', exc_info=1)


with ThreadPoolExecutor(max_workers=1, thread_name_prefix='T') as executor:
    for i in range(executor._max_workers):
        executor.submit(scrape, q, ses)

rows = list(rowsq.queue)
rows.sort(key=lambda e: e[0])
for row in rows:
    csv_writer.writerow(row)

# write buffer over csv file
with open('data-converted.csv', 'a') as fd:
    buf.seek(0)
    shutil.copyfileobj(buf, fd)

logger.info('time elapsed %s', str(datetime.now() - start_time))