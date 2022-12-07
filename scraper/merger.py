import logging
from datetime import datetime
import glob
import io
import shutil
import csv
from pathlib import Path

start_time = datetime.now()
log_format = '%(relativeCreated)8d %(threadName)4s %(message)s'
logging.basicConfig(level=logging.DEBUG, format=log_format)
file_handler = logging.FileHandler('logs/merger.txt', 'w')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(logging.Formatter(log_format))
logger = logging.getLogger()
logger.addHandler(file_handler)

data_dir = 'data'

all_rows = []
def merge_csv_into_all_rows(file):
    reader = csv.reader(file)
    for row in reader:
        [index, *_, scraped_at_str] = row
        index = int(index)
        if index < len(all_rows):
            existing_row = all_rows[index]
            if scraped_at_str > existing_row[-1]:
                logger.info('merging row %d', index)
                all_rows[index] = row
        elif index == len(all_rows):
            all_rows.append(row)
        else:
            logger.info('unexpected file %s, curr row index %d > expected index %d, skipping file', file.name, index, len(all_rows))
            return False # don't delete
    return True # can delete

files = glob.glob(data_dir + '/data-[0-9]*-[0-9]*.csv')
if len(files) < 2:
    logger.info('no data files to merge, exiting')
    exit(0)
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

for start, end in indexes:
    filebasename = 'data-%d-%d.csv' % (start, end)
    filename = '%s/data-%d-%d.csv' % (data_dir, start, end)
    with open(filename) as f:
        can_delete = merge_csv_into_all_rows(f)
    if can_delete:
        # hard remove existing file with same name in trash bin
        Path('/Users/david.choo/.Trash/' + filebasename).unlink(missing_ok=True)
        # soft remove file (move file to trash bin)
        shutil.move(filename, '/Users/david.choo/.Trash/')

# need to use buffer to force csv writer to print \n instead of \r\n as line ending of each row
buf = io.StringIO(newline=None)
writer = csv.writer(buf, delimiter=',')
writer.writerows(all_rows)
start_index = all_rows[0][0]
end_index = all_rows[-1][0]
with open('%s/data-%s-%s.csv' % (data_dir, start_index, end_index), 'w', newline='', encoding='utf-8') as fd:
    buf.seek(0)
    shutil.copyfileobj(buf, fd)

logger.info('merged %s-%s', start_index, end_index)
logger.info('time elapsed %s', str(datetime.now() - start_time))