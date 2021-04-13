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
import sys
from pathlib import Path
import glob

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
file_handler = logging.FileHandler('logs.txt', 'w')
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

# prev_data = ses.get('https://github.com/davidchoo12/nuswhispers-analysis/releases/latest/download/data-converted.csv').text
# with open('data-converted.csv', 'w') as fd:
#     fd.write(prev_data)
# last_no = 0
# with open('data-converted.csv', 'r') as fd:
#     csv_reader = csv.reader(fd)
#     *_, last_row = csv_reader
#     last_no = int(last_row[0])
# logger.info('last no %d', last_no)

def scrape_post_id_range(start_index, end_index):
    post_ids = open('post-ids.csv').readlines()
    q = Queue()
    for i, pid in enumerate(post_ids[start_index:end_index], start=start_index):
        q.put((i, pid))

    buf = io.StringIO(newline=None)
    csv_writer = csv.writer(buf, delimiter=',')
    # cols = ['no', 'text', 'image', 'post_id', 'likes', 'comments', 'shares', 'post_time', 'scraped_at']
    # csv_writer.writerow(cols)

    rowsq = Queue()
    broken_url = re.compile(r'http[s]://\swww\.nuswhispers\.\scom/confession/\s(\d+)')
    # likes_re = re.compile(r',like_count:(\d+)')
    # comments_re = re.compile(r',comment_count:(\d+)')
    # shares_re = re.compile(r',share_count:(\d+)')
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
                    redirect_url = res.headers['location']
                    if 'https://m.facebook.com/login.php' in redirect_url:
                        logger.info('response redirect to %s', redirect_url)
                        break
                    else:
                        rowsq.put([i, 'redirected to %s' % redirect_url, None, pid])
                        logger.info('response redirect to %s, skipping', redirect_url)
                        continue
                # logger.info('requested %s', url)
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
                likes = int(re.search(r'ft_ent_identifier:%s.*?,like_count:(\d+)'%pid, res.html.html).group(1))
                comments = int(re.search(r'ft_ent_identifier:%s.*?,comment_count:(\d+)'%pid, res.html.html).group(1))
                shares = int(re.search(r'ft_ent_identifier:%s.*?,share_count:(\d+)'%pid, res.html.html).group(1))
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


    with ThreadPoolExecutor(max_workers=16, thread_name_prefix='T') as executor:
        for i in range(executor._max_workers):
            executor.submit(scrape, q, ses)

    rows = list(rowsq.queue)
    rows.sort(key=lambda e: e[0])
    last_saved_index = 0
    for i, row in enumerate(rows):
        if row[0] == start_index+i:
            csv_writer.writerow(row)
            last_saved_index = row[0]
        else:
            break

    if len(rows) == 0:
        return -1
    # write buffer over csv file
    Path('data').mkdir(exist_ok=True) # ensure data dir exists
    with open('data/data-%d-%d.csv' % (start_index, last_saved_index), 'w', newline='', encoding='utf-8') as fd:
        buf.seek(0)
        shutil.copyfileobj(buf, fd)
    return last_saved_index


if __name__ == '__main__':
    paginate_limit = 100
    if len(sys.argv) == 1: # python converter.py
        # continue from the last data file index
        files = sorted(glob.glob('data/data-*.csv'))
        logger.info('data files %s', ','.join(files))
        start_index = 0
        if len(files) > 0:
            with open(files[-1], 'r') as fd:
                csv_reader = csv.reader(fd)
                *_, last_row = csv_reader
                last_no = int(last_row[0])
            logger.info('last no %d', last_no)
            start_index = last_no+1
        end_index = start_index+paginate_limit
    elif len(sys.argv) == 2: # python converter.py 556
        start_index = int(sys.argv[1]) * paginate_limit
        end_index = start_index+paginate_limit
    elif len(sys.argv) == 3: # python converter.py 55600 55900
        start_index = int(sys.argv[1])
        end_index = int(sys.argv[2])
    logger.info('start_index %d, end_index %d', start_index, end_index)
    assert(start_index < end_index)

    scrape_post_id_range(start_index, end_index)
    logger.info('time elapsed %s', str(datetime.now() - start_time))