import io
import csv
import logging
from concurrent.futures import ThreadPoolExecutor
from queue import Queue, Empty
from requests_html import HTMLSession, HTML
from requests.adapters import HTTPAdapter
import threading
from datetime import datetime, timezone, timedelta
import shutil
from itertools import groupby, count
import re
from pathlib import Path
import glob
import argparse
import json

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
file_handler = logging.FileHandler('logs/converter.txt', 'w')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(logging.Formatter(log_format))
logger = logging.getLogger()
logger.addHandler(file_handler)
threading.current_thread().name = 'M'

ses = HTMLSession()
ses.mount('https://', HTTPAdapter(pool_maxsize=2000))
base_url = 'https://www.facebook.com/nuswhispers/posts/%s'
default_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 Firefox/86.0',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Sec-Fetch-Site': 'none',
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

data_dir = 'data'
index_last_changed_filename = 'index-last-changed.csv'

# scrape post ids in range [start_index, end_index), ie start_index inclusive, end_index exclusive
def scrape_post_id_range(start_index, end_index, threads=100, min_post_age=0):
    post_ids = open('post-ids.csv').readlines()
    q = Queue()
    for i, pid in enumerate(post_ids[start_index:end_index], start=start_index):
        q.put((i, pid))

    buf = io.StringIO(newline=None)
    csv_writer = csv.writer(buf, delimiter=',')
    # cols = ['no', 'text', 'image', 'post_id', 'likes', 'comments', 'shares', 'post_time', 'scraped_at']
    # csv_writer.writerow(cols)

    rowsq = Queue()
    post_text_div_re = re.compile(r'"message":{"text":(".+")},"referenced_sticker"')
    image_re = re.compile(r'href="https://www.facebook.com/nuswhispers/photos.+?<img[^>]?src="([^"]+)')
    post_time_re = re.compile(r'"story":{"creation_time":(\d+).+?')
    likes_re = re.compile(r'"Like"},"i18n_reaction_count":"(\d+)"')
    comments_re = re.compile(r'total_comment_count":(\d+)')
    shares_re = re.compile(r'i18n_share_count":"(\d+)')

    backup_post_text_div_re = re.compile(r'<div data-testid="post_message".+?</div>')
    backup_image_re = re.compile(r'<div data-testid="post_message".+?<img.+?src="([^"]+)')
    backup_post_time_re = re.compile(r'data-utime=\"(\d+)\".+?<div data-testid="post_message"')

    def extract_data(html='', pid=0):
        post_text_div_match = post_text_div_re.search(html)
        if post_text_div_match:
            text = json.loads(post_text_div_match.group(1)).replace('\n\n', '\n')
            image_match = image_re.search(html)
            image = image_match.group(1) if image_match else ''
            post_time_int = int(post_time_re.search(html).group(1))
            post_time = datetime.fromtimestamp(post_time_int).astimezone().astimezone(timezone.utc)
            likes_match = likes_re.search(html)
            likes = likes_match.group(1) if likes_match else 0
            comments = comments_re.search(html).group(1)
            shares = shares_re.search(html).group(1)
        elif 'This content isn\'t available at the moment' in html:
            return 'not found', None, None, None, None, None
        else:
            logger.debug('post text div not found, fallback to backup regexes %s %s', pid, html)
            post_text_div_match = backup_post_text_div_re.search(html)
            if not post_text_div_match:
                return 'unexpected failed match', None, None, None, None, None
            text = HTML(html=post_text_div_match.group(0)).text
            image_match = backup_image_re.search(html)
            image = image_match.group(1) if image_match else ''
            post_time_int = int(backup_post_time_re.search(html).group(1))
            post_time = datetime.fromtimestamp(post_time_int).astimezone().astimezone(timezone.utc)
            likes_match = re.search(r'Like.+?i18n_reaction_count:"(\d+)".*?share_fbid:"%s"' % pid, html)
            likes = likes_match.group(1) if likes_match else 0
            comments = re.search(r'i18n_comment_count:"(\d+).*?share_fbid:"%s"' % pid, html).group(1)
            shares = re.search(r'i18n_share_count:"(\d+).*?share_fbid:"%s"' % pid, html).group(1)
        return text, image, likes, comments, shares, post_time

    def scrape(q, ses):
        try:
            while task := q.get(timeout=2):
                i, pid = task
                pid = pid.rstrip()
                url = base_url % pid
                # logger.info('requesting %s', url)
                # time.sleep(2) # to avoid rate limit
                res = ses.get(url, allow_redirects=False)
                res_dest = '/tmp/converter-last-response.html'
                logger.debug('saving response to ' + res_dest)
                with open(res_dest, 'w') as fd:
                    fd.write(res.text)
                scraped_at = datetime.now().astimezone(timezone.utc)
                scraped_at_str = scraped_at.isoformat(timespec='seconds')
                if res.is_redirect:
                    redirect_url = res.headers['location']
                    if 'https://www.facebook.com/login' in redirect_url:
                        logger.info('response redirect to %s', redirect_url)
                        break
                    else:
                        rowsq.put([i, 'redirected to %s' % redirect_url, None, pid, None, None, None, None, scraped_at_str])
                        logger.info('response redirect to %s, skipping', redirect_url)
                        continue
                # logger.info('requested %s', url)
                # logger.info(res.html.html)
                text, image, likes, comments, shares, post_time = extract_data(res.html.html, pid)
                if text == 'not found':
                    rowsq.put([i, 'not found', None, pid, None, None, None, None, scraped_at_str])
                    logger.info('post %s not found, skipping', pid)
                    continue
                elif text == 'unexpected failed match':
                    raise Exception('unexpected regex failed match even with backup regex')
                post_time_str = post_time.isoformat(timespec='seconds')

                if scraped_at - post_time < timedelta(days=min_post_age):
                    logger.info('post is less than %d days old, skipping', min_post_age)
                    continue
                row = [i, text, image, pid, likes, comments, shares, post_time_str, scraped_at_str]
                rowsq.put(row)
                logger.info('rowsq size %d', rowsq.qsize())
        except Empty:
            pass # ignore empty queue
        except:
            logger.error('exception ', exc_info=1)


    with ThreadPoolExecutor(max_workers=min(end_index - start_index, threads), thread_name_prefix='T') as executor:
        for i in range(executor._max_workers):
            executor.submit(scrape, q, ses)

    rows = list(rowsq.queue)
    rows.sort(key=lambda e: e[0])
    last_saved_index = 0
    contiguous_rows = []
    for i, row in enumerate(rows):
        if row[0] == start_index+i:
            contiguous_rows.append(row)
            last_saved_index = row[0]
        else:
            break

    if len(rows) == 0 or len(contiguous_rows) == 0:
        logger.info('not saving data file, rows scraped count %d', len(rows))
        return []

    csv_writer.writerows(contiguous_rows)
    # write buffer over csv file
    Path('data').mkdir(exist_ok=True) # ensure data dir exists
    with open('%s/data-%d-%d.csv' % (data_dir, start_index, last_saved_index), 'w', newline='', encoding='utf-8') as fd:
        buf.seek(0)
        shutil.copyfileobj(buf, fd)
    return contiguous_rows

def read_all_rows():
    data_0_files = glob.glob(data_dir + '/data-0-[0-9]*.csv')
    if len(data_0_files) == 0:
        return []
    # choose highest ending index
    all_rows_file = sorted(data_0_files, key=lambda f: -int(f.split('-')[2].rstrip('.csv')))[0]

    all_rows = []
    with open(all_rows_file) as f:
        all_rows_reader = csv.reader(f)
        for row in all_rows_reader:
            all_rows.append(row)
    return all_rows

# read index-last-changed.csv
def read_index_last_changed():
    index_last_changed = {}
    with open(index_last_changed_filename) as fd:
        reader = csv.reader(fd)
        for row in reader:
            index, last_changed = row
            index_last_changed[int(index)] = last_changed
    return index_last_changed

# update index-last-changed.csv
def update_index_last_changed(all_rows, rows_scraped):
    index_last_changed = read_index_last_changed()
    last_changed_has_change = False
    for row in rows_scraped:
        index = row[0]
        if len(row) != 9:
            # if new row or row has changed
            if index >= len(all_rows) or row != all_rows[index]:
                index_last_changed[row[0]] = ''
                last_changed_has_change = True
            continue
        scraped_at_str = row[8]
        # if new row or row has changed
        if index >= len(all_rows) or [str(col) if col != None else '' for col in row[:-1]] != all_rows[index][:-1]:
            index_last_changed[index] = scraped_at_str
            last_changed_has_change = True

    if last_changed_has_change:
        logger.info('updating %s', index_last_changed_filename)
        index_last_changed_csv = sorted(index_last_changed.items())
        buf = io.StringIO(newline=None)
        writer = csv.writer(buf, delimiter=',')
        writer.writerows(index_last_changed_csv)
        with open(index_last_changed_filename, 'w', newline='', encoding='utf-8') as fd:
            buf.seek(0)
            shutil.copyfileobj(buf, fd)
    else:
        logger.info('no change on all scraped rows, no update on index-last-changed.csv')

# rescrape existing posts
def rescrape_posts(all_rows, min_last_changed_days):
    if min_last_changed_days <= 0:
        logger.info('skipping rescrape, min_last_changed_days %d <= 0', min_last_changed_days)
        return
    min_last_changed = timedelta(days=min_last_changed_days)
    index_last_changed = read_index_last_changed()

    indexes_to_rescrape = []
    for row in all_rows:
        if len(row) != 9:
            # logger.info('rescrape skipping no %s, len(row) %d != 9, text = %s', row[0], len(row), row[1])
            continue
        [index, *_, post_time_str, scraped_at_str] = row
        index = int(index)
        if index not in index_last_changed:
            logger.info('rescrape skipping no %d, not in index-last-changed.csv', index)
            continue
        last_changed_str = index_last_changed[index]
        if last_changed_str == '':
            continue
        if any(s == '' for s in [post_time_str, scraped_at_str, last_changed_str]):
            continue
        post_time, scraped_at, last_changed = map(datetime.fromisoformat, [post_time_str, scraped_at_str, last_changed_str])
        # filter indexes to rescrape
        if scraped_at - last_changed < min_last_changed or scraped_at - post_time < min_last_changed:
            indexes_to_rescrape.append(index)

    indexes_to_rescrape.sort()
    # logger.debug('indexes_to_rescrape %s', indexes_to_rescrape)
    if len(indexes_to_rescrape) == 0:
        return

    ranges_to_rescrape = []
    # group contiguous indexes, src https://stackoverflow.com/a/15019976/4858751
    for _, group in groupby(indexes_to_rescrape, key=lambda i,j=count(): i-next(j)):
        indexes_group = list(group)
        ranges_to_rescrape.append([indexes_group[0], indexes_group[-1]])
    logger.debug('ranges to rescrape %s', ranges_to_rescrape)

    rows_rescraped = []
    for range_to_rescrape in ranges_to_rescrape:
        start_index = range_to_rescrape[0]
        end_index = range_to_rescrape[-1] + 1
        rows = scrape_post_id_range(start_index, end_index)
        rows_rescraped.extend(rows)
    logger.info('rescraped %d rows', len(rows_rescraped))

    update_index_last_changed(all_rows, rows_rescraped)

def run(args):
    all_rows = read_all_rows()
    rescrape_posts(all_rows, args.min_last_changed_days)
    paginate_limit = args.limit
    start_index = args.start_index
    if start_index is None:
        # continue from the last data file index
        files = sorted(glob.glob(data_dir + '/data-0-[0-9]*.csv'))
        logger.info('data files %s', ','.join(files))
        start_index = 0
        if len(files) > 0:
            with open(files[-1], 'r') as fd:
                csv_reader = csv.reader(fd)
                *_, last_row = csv_reader
                last_no = int(last_row[0])
            logger.info('last no %d', last_no)
            start_index = last_no+1
    start_index += args.page * paginate_limit

    end_index = args.end_index
    if end_index is None:
        end_index = start_index+paginate_limit

    if start_index >= end_index:
        logger.info('start_index %d >= end_index %d, exiting', start_index, end_index)
        return
    logger.info('start_index %d, end_index %d', start_index, end_index)
    new_rows_scraped = scrape_post_id_range(start_index, end_index, args.threads, args.min_post_age)

    update_index_last_changed(all_rows, new_rows_scraped)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-s', '--start_index', type=int, nargs='?',
                        help='index to start scraping from, refer to post-ids.csv (line 1 = index 0)')
    parser.add_argument('-e', '--end_index', type=int,
                        help='index to stop scraping at')
    parser.add_argument('-p', '--page', type=int, default=0,
                        help='offset page from start_index to start from')
    parser.add_argument('-l', '--limit', type=int, default=300,
                        help='pagination limit, set 0 for only rescrape')
    parser.add_argument('-t', '--threads', type=int, default=100,
                        help='no of threads to run with')
    parser.add_argument('-a', '--min-post-age', type=int, default=0,
                        help='min no of days between post time and scraped time, ie stop scraping posts newer than this no of days old')
    parser.add_argument('-c', '--min-last-changed-days', type=int, default=3,
                        help='min no of days between last changed time and now, ie don\'t rescrape posts that has last changed >= this no of days old, set 0 for no rescrape')
    args = parser.parse_args()
    logger.info('args %s', args)

    try:
        run(args)
    except:
        logger.exception('something went wrong')
    logger.info('time elapsed %s', str(datetime.now() - start_time))