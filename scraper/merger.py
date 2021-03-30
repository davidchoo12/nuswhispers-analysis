import logging
from datetime import datetime
import glob
import io
import shutil
from converter import scrape_post_id_range

start_time = datetime.now()
log_format = '%(relativeCreated)8d %(threadName)4s %(message)s'
logging.basicConfig(level=logging.DEBUG, format=log_format)
file_handler = logging.FileHandler('logs.txt', 'w')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(logging.Formatter(log_format))
logger = logging.getLogger()
logger.addHandler(file_handler)

files = glob.glob('data/*.csv')
indexes = []
for file in files:
    start = int(file.split('-')[1])
    end = int(file.split('-')[2].rstrip('.csv'))
    indexes.append((start, end))

indexes.sort(key=lambda e: e[0])


last_saved_index = 0
buf = io.StringIO()
prev_end = indexes[0][0]-1
for start, end in indexes:
    # if there is a gap
    if prev_end + 1 != start:
        logger.info('missing %d-%d, scraping to fill gap', prev_end+1, start-1)
        # try to scrape the gap
        last_saved_index = scrape_post_id_range(prev_end+1, start)
        if last_saved_index + 1 != start:
            # failed to fill gap
            logger.info('failed to fill gap, stopping merge')
            break
        else:
            buf.write(open('data/data-%d-%d.csv' % (prev_end+1, last_saved_index)).read())
            logger.info('appended %d-%d (scraped)', prev_end+1, last_saved_index)
    buf.write(open('data/data-%d-%d.csv' % (start, end)).read())
    logger.info('appended %d-%d', start, end)
    last_saved_index = end
    prev_end = end

with open('data/data-merged-%d-%d.csv' % (indexes[0][0], last_saved_index), 'w') as fd:
    buf.seek(0)
    shutil.copyfileobj(buf, fd)

logger.info('merged %d-%d', indexes[0][0], last_saved_index)
logger.info('time elapsed %s', str(datetime.now() - start_time))