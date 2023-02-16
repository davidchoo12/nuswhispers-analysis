# id scraper

# list of story ids
# get /nuswhispers/posts
# loop
#   find page_content url
#   get page_content url
#   if response not ok, break
#   regex find all story ids
#   extend list

# existing ids newest first, eg [3, 1]
# scraped ids newest first, eg [5, 4, 2, 1, 0]
# goal extend to front of existing ids, eg [5, 4, 3, 2, 1]

# scraped ids [new, existing, (new??)]
# scraped new in existing = list(set(existing) - set(existing ids[:len(existing)]))
# scraped not found in existing = list(set(existing ids[:len(existing)]) - set(existing))
# print both
# remove all existing, append to front

from datetime import datetime
import logging
import re
import requests
from requests.exceptions import HTTPError
import time
import json

start_time = datetime.now()
log_format = '%(relativeCreated)8d %(message)s'
logging.basicConfig(level=logging.DEBUG, format=log_format)
file_handler = logging.FileHandler('logs/post-id-scraper.txt', 'w')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(logging.Formatter(log_format))
logger = logging.getLogger()
logger.addHandler(file_handler)

ses = requests.Session()
base_url = 'https://www.facebook.com'
# src https://github.com/kevinzg/facebook-scraper/blob/master/facebook_scraper/facebook_scraper.py#L50
default_headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0',
    'Sec-Fetch-Site': 'none',
}
ses.headers.update(default_headers)

cursor_re = re.compile(r'"has_next_page":true,"end_cursor":"([^"]+)')
post_ids_re = re.compile(r'"post_id":"([^"]+)')
haste_session_re = re.compile(r'"haste_session":"([^"]+)')

old_post_ids = [l.rstrip() for l in open('post-ids.csv').readlines()]
old_post_ids_set = set(old_post_ids)

RETRY_LIMIT = 10

post_ids_matches = []
for retry in range(1, RETRY_LIMIT + 1):
    res = ses.get(base_url + '/nuswhispers', stream=True)
    server_ip = res.raw._connection.sock.getpeername()[0]
    logger.debug(f'attempt no {retry}, server ip {server_ip}, code {res.status_code}')
    post_ids_matches = post_ids_re.findall(res.text)
    if len(post_ids_matches) > 0:
        break

scraped_post_ids = curr_post_ids = list(dict.fromkeys(post_ids_matches))
haste_session = haste_session_re.search(res.text).group(1)
cursor = cursor_re.search(res.text).group(1)

i = 0
while old_post_ids[-1] not in curr_post_ids:
    logger.debug('%d %d %s', i, len(scraped_post_ids), scraped_post_ids[-1])
    formdata = {
        '__hs': haste_session, # required param to get the next cursor
        'variables': json.dumps({
            'count': 3,
            'cursor': cursor,
            'id': '100064334663849'
        }, separators=(',', ':')),
        'doc_id': '6039881786065786',
    }

    # src https://github.com/kevinzg/facebook-scraper/blob/master/facebook_scraper/page_iterators.py#L88
    for retry in range(1, RETRY_LIMIT + 1):
        try:
            res = ses.post(base_url + '/api/graphql', data=formdata, headers={'Sec-Fetch-Site': 'same-origin'})
            res.raise_for_status()
            break
        except HTTPError as e:
            if e.response.status_code == 500 and retry < RETRY_LIMIT:
                sleep_duration = retry * 2
                logger.debug(f'response HTTP 500 from attempt no {retry}, sleeping for {sleep_duration} seconds')
                time.sleep(sleep_duration)
            else:
                logger.error('exception ', exc_info=1)
    if not res.ok:
        break
    res_dest = '/tmp/post-id-scraper-last-success-page.html'
    logger.error('saving response to ' + res_dest)
    with open(res_dest, 'w') as fd:
        fd.write(res.text)

    curr_post_ids = list(dict.fromkeys(post_ids_re.findall(res.text)))
    cursor_match = cursor_re.search(res.text)
    if cursor_match:
        cursor = cursor_match.group(1)
    else:
        logger.info('cursor not found')
        break
    scraped_post_ids.extend(curr_post_ids)
    i += 1

# remove any existing post ids
scraped_post_ids = [pid for pid in scraped_post_ids if pid not in old_post_ids_set]
scraped_post_ids.reverse()

post_ids_to_save = old_post_ids + scraped_post_ids
if post_ids_to_save == old_post_ids:
    logger.info('post ids no change')

logger.info('%d new post ids, new total %d', len(scraped_post_ids), len(post_ids_to_save))
with open('post-ids.csv', 'w') as fd:
    fd.write('\n'.join(str(p) for p in post_ids_to_save))

logger.info('time elapsed %s', str(datetime.now() - start_time))
