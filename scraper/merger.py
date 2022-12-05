import logging
from datetime import datetime
import glob
import io
import shutil
from converter import scrape_post_id_range

start_time = datetime.now()
log_format = '%(relativeCreated)8d %(threadName)4s %(message)s'
logging.basicConfig(level=logging.DEBUG, format=log_format)
file_handler = logging.FileHandler('logs/merger.txt', 'w')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(logging.Formatter(log_format))
logger = logging.getLogger()
logger.addHandler(file_handler)

files = glob.glob('data/data-[0-9]*-[0-9]*.csv')
indexes = []
for file in files:
    try:
        start = int(file.split('-')[1])
        end = int(file.split('-')[2].rstrip('.csv'))
        indexes.append((start, end))
    except ValueError: # fail to parse int, skip file
        continue

# sort indexes by lowest start index, highest end index
indexes.sort(key=lambda e: (e[0], -e[1]))
logger.info('indexes %s', indexes)

buf = io.StringIO()

def append_data_file(start, end):
    path_to_append = 'data/data-%d-%d.csv' % (start, end)
    buf.write(open(path_to_append).read())
    logger.info('appended %d-%d', start, end)
    # soft remove file (move file to trash bin)
    shutil.move(path_to_append, '/Users/david.choo/.Trash/')

last_saved_index = 0
prev_end = indexes[0][0]-1
for start, end in indexes:
    # nothing more to merge
    if start == indexes[0][0] and end == indexes[-1][1]:
        logger.info('nothing more to merge, exiting')
        exit(1)
    if start > end:
        logger.info('unexpected file with start index %d > end index %d, skipping', start, end)
        continue
    # ensure the curr start index > prev end index
    if start <= prev_end:
        continue
    # if there is a gap
    if prev_end + 1 != start:
        logger.info('missing %d-%d, scraping to fill gap', prev_end+1, start-1)
        # try to scrape the gap
        last_saved_index = scrape_post_id_range(prev_end+1, start)
        if last_saved_index + 1 != start:
            # failed to fill gap
            logger.info('failed to fill gap, stopping merge')
            last_saved_index = prev_end
            break
        else:
            logger.info('scraped %d-%d', prev_end+1, last_saved_index)
            append_data_file(prev_end+1, last_saved_index)
    append_data_file(start, end)
    last_saved_index = end
    prev_end = end

with open('data/data-%d-%d.csv' % (indexes[0][0], last_saved_index), 'w') as fd:
    buf.seek(0)
    shutil.copyfileobj(buf, fd)

logger.info('merged %d-%d', indexes[0][0], last_saved_index)
logger.info('time elapsed %s', str(datetime.now() - start_time))