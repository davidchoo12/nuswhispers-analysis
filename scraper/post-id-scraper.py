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
file_handler = logging.FileHandler('logs-post-id-scraper.txt', 'w')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(logging.Formatter(log_format))
logger = logging.getLogger()
logger.addHandler(file_handler)

ses = requests.Session()
base_url = 'https://m.facebook.com'
# src https://github.com/kevinzg/facebook-scraper/blob/master/facebook_scraper/facebook_scraper.py#L50
default_headers = {
    'Accept-Language': 'en-US,en;q=0.5',
    'Sec-Fetch-User': '?1',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8',
}
ses.headers.update(default_headers)

# prev_data = ses.get('https://github.com/davidchoo12/nuswhispers-analysis/releases/latest/download/post-ids.csv').text
# with open('post-ids.csv', 'w') as fd:
#     fd.write(prev_data)

page_content_re = re.compile(r'/page_content[^"]+')
page_content_re2 = re.compile(r'\\\\\\(/page_content.+?)\\"')
story_ids_re = re.compile(r'/story\.php\?story_fbid=(\d+)&(?:amp;)?id=695707917166339')

old_post_ids = [int(l.rstrip()) for l in open('post-ids.csv').readlines()]


res = ses.get('https://m.facebook.com/nuswhispers/posts/')
# unique post ids, src https://stackoverflow.com/a/37163210/4858751
curr_post_ids = post_ids = list(dict.fromkeys(story_ids_re.findall(res.text)))
next_url = page_content_re.search(res.text).group(0)
# override next_url here if scraping failed and rerun to continue from where it left off
# next_url = '/page_content_list_view/more/?page_id=695707917166339&start_cursor=%7B%22timeline_cursor%22%3A%22AQHRgyWnW-PY8R7r1fLfRhmMlPgdYuqWan2roipqAcXXQ5MB1wMinPDt1Y5LMD469hOXkq3gxC1kj4IeiaH5Thj0j5YeTYWLU6LRtxRkNne6N9PzsMdqZGFLNpAO0ffEmZza%22%2C%22timeline_section_cursor%22%3Anull%2C%22has_next_page%22%3Atrue%7D&num_to_fetch=30&surface_type=posts_tab'
posts_per_loop = 30
i = 0
logger.debug('len post_ids %d', len(post_ids))
if len(post_ids) == 0:
    logger.error('empty first page post ids, try rerun cos it may fail for no reason sometimes')
    exit(1)
# change to while True to scrape all the way to the oldest post
while int(curr_post_ids[-1]) > old_post_ids[-1]:
    logger.debug('%d %d %s', i, len(post_ids), post_ids[-1])
    next_url = next_url.replace('num_to_fetch=4&', f'num_to_fetch={posts_per_loop}&')
    # logger.debug('next_url %s', next_url)
    # src https://github.com/kevinzg/facebook-scraper/blob/master/facebook_scraper/page_iterators.py#L88
    RETRY_LIMIT = 10
    for retry in range(1, RETRY_LIMIT + 1):
        try:
            res = ses.get(base_url + next_url)
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
    curr_post_ids = list(dict.fromkeys(story_ids_re.findall(res.text)))
    post_ids.extend(curr_post_ids)
    next_url_match = page_content_re2.search(res.text)
    if next_url_match:
        next_url = next_url_match[1].replace('\\\\', '\\').encode('utf-8').decode('unicode_escape').replace('\\/', '/')
    else:
        logger.info('next_url not found')
        break
    i += 1

post_ids = [int(i) for i in post_ids]
post_ids.reverse()
logger.info('%d post_ids scraped', len(post_ids))
# print('post_ids', '\n'.join(str(p) for p in post_ids))

# check on order
# eg old_post_ids=[0,2,4], post_ids=[1,3,5]
# overlapping_oldpids=[2,4], overlapping_pids=[1,3]
# expect removed_post_ids=[2,4], missed_post_ids=[1,3], union=[1,2,3,4,5]
# old_post_ids=[0,2,4]
# post_ids=[1,3,5]
try:
    last_nonoverlapping_oldpid = next(i for i in range(len(old_post_ids)-1, -1, -1) if old_post_ids[i] < post_ids[0])
except StopIteration: # shouldn't happen, new post ids have lower id than the lowest of all old post ids
    last_nonoverlapping_oldpid = -1
overlapping_oldpids = old_post_ids[last_nonoverlapping_oldpid+1:]
# logger.debug('OOP %s', overlapping_oldpids)
try:
    first_new_pid_index = next(i for i,p in enumerate(post_ids) if p > old_post_ids[-1])
except StopIteration: # no new post ids
    first_new_pid_index = len(post_ids)
overlapping_pids = post_ids[:first_new_pid_index]
# logger.debug('OP %s', overlapping_pids)
overlapping_oldpids = set(overlapping_oldpids)
overlapping_pids = set(overlapping_pids)
removed_post_ids = sorted(list(overlapping_oldpids - overlapping_pids))
missed_post_ids = sorted(list(overlapping_pids - overlapping_oldpids))
union = sorted(list(overlapping_oldpids.union(overlapping_pids)))

logger.info('%d removed (not found in scraped but found in old data): %s', len(removed_post_ids), removed_post_ids)
logger.info('%d missed (not found in old data but found in scraped): %s', len(missed_post_ids), missed_post_ids)
# logger.debug('union %s', union)
post_ids_to_save = sorted(set(old_post_ids[:last_nonoverlapping_oldpid+1] + union + post_ids[first_new_pid_index:]))
if post_ids_to_save == old_post_ids:
    logger.info('post ids no change')
# f = open('removed.txt', 'w')
# f.write('\n'.join(str(p) for p in removed_post_ids))
# f = open('missed.txt', 'w')
# f.write('\n'.join(str(p) for p in missed_post_ids))
# f = open('union.txt', 'w')
# f.write('\n'.join(str(p) for p in union))
# f = open('post-ids-scraped.csv', 'w')
# f.write('\n'.join(str(p) for p in post_ids))
logger.info('%d new post ids, new total %d', len(post_ids[first_new_pid_index:]), len(post_ids_to_save))
with open('post-ids.csv', 'w') as fd:
    fd.write('\n'.join(str(p) for p in post_ids_to_save))

logger.info('time elapsed %s', str(datetime.now() - start_time))

# alternate implementation for resolving overlaps, just using sorted lists for overlapping_oldpids and overlapping_pids, without converting to sets, should be more performant but since posts_per_loop is small enough, prefer shorter code over performance
# OOPi = OPi = 0
# missed_post_ids = []
# removed_post_ids = []
# union = []
# while OOPi < len(overlapping_oldpids) and OPi < len(overlapping_pids):
#     print(OOPi, overlapping_oldpids[OOPi], OPi, overlapping_pids[OPi])
#     if overlapping_oldpids[OOPi] < overlapping_pids[OPi]:
#         removed_post_ids.append(overlapping_oldpids[OOPi])
#         union.append(overlapping_oldpids[OOPi])
#         OOPi += 1
#     elif overlapping_oldpids[OOPi] > overlapping_pids[OPi]:
#         missed_post_ids.append(overlapping_pids[OPi])
#         union.append(overlapping_pids[OPi])
#         OPi += 1
#     else:
#         union.append(overlapping_pids[OPi])
#         OOPi += 1
#         OPi += 1
# removed_post_ids.extend(overlapping_oldpids[OOPi:])
# missed_post_ids.extend(overlapping_pids[OPi:])
# union.extend(overlapping_oldpids[OOPi:])
# union.extend(overlapping_pids[OPi:])
