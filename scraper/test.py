import glob
import csv

ids = open('post-ids.csv', 'r').readlines()
files = glob.glob('data-[0-9]*-[0-9]*.csv')
f = open(files[0], 'r')
reader = csv.reader(f)

prev_pid = 0
for i, row in enumerate(reader):
  if row[3] != ids[i].rstrip():
    print('index post id mismatch, index %d actual post id %s expected post id %s'.format(i, row[3], ids[i]))
    break
  if i != int(row[0]):
    print('index not consecutive, actual index %s expected index %d', row[0], i)
    break
  if int(row[3]) < prev_pid:
    print('post ids not sorted, index %d post id %s', i, row[3])
    break
  prev_pid = int(row[3])
