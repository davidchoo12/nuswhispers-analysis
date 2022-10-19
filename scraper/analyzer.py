import logging
from datetime import datetime, timedelta, timezone
import glob
import numpy as np
import pandas as pd
from itertools import product
from pathlib import Path
import json
import re
from concurrent.futures import ProcessPoolExecutor
import glob

# NLP libs
import nltk
nltk.download('stopwords')
nltk.download('wordnet')
from nltk.corpus import stopwords, wordnet
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import RegexpTokenizer
nltk.download('omw-1.4') # for wordnet.ADJ
nltk.download('averaged_perceptron_tagger') # for nltk.pos_tag
from nltk.tag.perceptron import PerceptronTagger
from sklearn.feature_extraction.text import TfidfVectorizer


start_time = datetime.now()
log_format = '%(relativeCreated)8d %(message)s'
logging.basicConfig(level=logging.DEBUG, format=log_format)
path = Path('logs/analyzer.txt')
path.parent.mkdir(parents=True, exist_ok=True)
file_handler = logging.FileHandler(path, 'w')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(logging.Formatter(log_format))
logger = logging.getLogger()
logger.addHandler(file_handler)

# find data file to analyze
files = glob.glob('data/data-0-[0-9]*.csv')
indexes = []
last_index = 0
for file in files:
    try:
        end = int(file.split('-')[2].rstrip('.csv'))
        if end > last_index:
            last_index = end
    except ValueError: # fail to parse int, skip file
        continue
logger.info('last_index %d', last_index)

# prepare dataframe
columns = ['no', 'text', 'image', 'pid', 'likes', 'comments', 'shares', 'post_time', 'scraped_at']
metric_cols = ['likes', 'comments', 'shares']
df = pd.read_csv(f'data/data-0-{last_index}.csv', names=columns)
for col in ['post_time', 'scraped_at']:
    df[col] = pd.to_datetime(df[col])
# df['fb_post_id'] = df['fb_post_id'].astype('Int64')
for col in metric_cols:
    df[col] = df[col].astype('Int64')
df.drop(df[df['text'] == 'not found'].index, inplace=True)
df.drop(index=43106, inplace=True) # the post that redirects to straits times post
# add confession id column, reorder to second column
df['cid'] = df['text'].str.extract(r'\n-\n#\d+: https?://(?:www\.)?nuswhispers\.com/confession/(\d+)$')
header_cid = df[df['cid'].isnull().to_numpy()]['text'].str.extract(r'^#(\d+): ')
df['cid'].fillna(header_cid[0], inplace=True)
df.insert(1, 'cid', df.pop('cid'))

# start processing
now = datetime.now(timezone.utc)
now = datetime.fromisoformat('2021-04-25T00:00:00+00:00') # for testing
logger.info('now %s', now.isoformat())

# src https://stackoverflow.com/a/65151218/4858751
# for serializing to json
def np_encoder(obj):
    if isinstance(obj, np.int64):
        return int(obj)

def save_file(content, filename):
    dest = 'analyzer-output/' + filename
    path = Path(dest)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    logger.info('saved ' + dest)

def gen_top_posts():
    opt_td = {
        'all': timedelta(days=100000),
        'year': timedelta(days=365),
        'month': timedelta(days=30),
        'week': timedelta(weeks=1)
    }
    for metric, opt in product(metric_cols, opt_td):
        sorted_df = df[df['post_time'] > now - opt_td[opt]].sort_values(metric, ascending=False)
        csv = sorted_df[:50].to_csv(index=False)
        save_file(csv, f'top-posts/{metric}-{opt}.csv')
    # df['controversial_ratio'] = df['comments'] / (df['likes'] + df['shares'] + 0.00001)
    # for opt in opt_td:
    #     ratio = df[df['post_time'] > now - opt_td[opt]].sort_values(['controversial_ratio'], ascending=False)
    #     save_file(ratio[:50].to_csv(index=False), f'top-posts/controversial-{opt}.csv')


def gen_posts_freq():
    opt_rule = {
        'day': 'D',
        'week': 'W',
        'month': 'M',
        'year': 'Y',
    }
    # posts_freq = {}
    for opt, rule in opt_rule.items():
        aggregated_df = df.resample(rule, on='post_time')['post_time'].agg(count='count')
        aggregated_df.index = pd.to_datetime(aggregated_df.index).strftime('%Y-%m-%d')
        csv = aggregated_df.to_csv()
        save_file(csv, f'posts-freq/{opt}.csv')
        # posts_freq[opt] = [list(aggregated_df.index), list(aggregated_df.values)]
    # posts_freq['all'] = [['all time'], [len(df)]]
    # save_file(json.dumps(posts_freq, separators=(',', ':'), default=np_encoder), f'posts-freq.json')
    # group by hour of day
    grouped_df = df.groupby(df['post_time'].dt.hour)['post_time'].agg(count='count')
    csv = grouped_df.to_csv()
    save_file(csv, f'posts-freq/hourofday.csv')

def gen_metrics_distribution():
    ranges = [0, *(2**i for i in range(11)), float('inf')]
    labels = [*(f'{start}-{ranges[i+1]-1}' if start<ranges[i+1]-1 else start for i, start in enumerate(ranges[:-2])), f'>{ranges[-2]}']
    for metric in metric_cols:
        distr = df[metric].groupby(df[metric]).count()
        grouped_distr = distr.groupby(pd.cut(distr.index, ranges, right=False, labels=labels)).sum()
        grouped_distr.index.names = ['range']
        grouped_distr.rename('count', inplace=True)
        csv = grouped_distr.to_csv()
        save_file(csv, f'metrics-distribution/{metric}.csv')

def gen_metrics_medians():
    opt_rule = {
        'day': 'D',
        'week': 'W',
        'month': 'M',
        'year': 'Y',
    }
    for metric, opt in product(metric_cols, opt_rule):
        grouped_df = df.resample(opt_rule[opt], on='post_time')[metric].median()
        grouped_df.index = pd.to_datetime(grouped_df.index).strftime('%Y-%m-%d')
        grouped_df.rename('median', inplace=True)
        csv = grouped_df.to_csv()
        save_file(csv, f'metrics-medians/{metric}-{opt}.csv')
    # group by hour of day
    for metric in metric_cols:
        grouped_df = df.groupby(df['post_time'].dt.hour)[metric].median()
        grouped_df.rename('median', inplace=True)
        csv = grouped_df.to_csv()
        save_file(csv, f'metrics-medians/{metric}-hourofday.csv')
    # group by minute of day
    # for metric in metric_cols:
    #     grouped_df = df.groupby(df['post_time'].dt.hour * 60 + df['post_time'].dt.minute)[metric].median()
    #     csv = grouped_df.to_csv()
    #     save_file(csv, f'metrics-medians/{metric}-minuteofday.csv')


tokenizer = RegexpTokenizer(r'[a-zA-Z0-9]+') # pros: no need to deal with unicode punctuations or other weird unicode text, cons: will lose actual unicode text eg text with chinese characters
tagger = PerceptronTagger() # supposedly optimize pos_tag but no noticeable impact, src https://stackoverflow.com/a/33829434/4858751
stopwords_en = set(stopwords.words('english')) # supposedly optimize checking stopwords but no noticeable impact
lemmatizer = WordNetLemmatizer()

# src https://www.machinelearningplus.com/nlp/lemmatization-examples-python/#wordnetlemmatizerwithappropriatepostag
# pos = part of speech, src https://www.nltk.org/_modules/nltk/stem/wordnet.html
pos_wordnetpos = {
    "J": wordnet.ADJ,
    "N": wordnet.NOUN,
}
# custom lemmas
known_token_lemma = {
    'nus': 'nus',
    'cs': 'cs',
    'ns': 'ns',
    'ex': 'ex',
    'bf': 'boyfriend',
    'gf': 'girlfriend'
}
def tokenize(text):
    # tokenize, aka split to words
    tokens = tokenizer.tokenize(text)
    lemmas = []
    for (token, pos) in tagger.tag(tokens):
        # remove stop words
        if token in stopwords_en:
            continue
        # only include adjectives and nouns
        if pos[0] not in pos_wordnetpos:
            continue
        # if token is any of the known words, skip lemmatize
        if token in known_token_lemma:
            lemmas.append(known_token_lemma[token])
            continue
        wordnetpos = pos_wordnetpos[pos[0]]
        # lemmatize
        lemma = lemmatizer.lemmatize(token, wordnetpos)
        # don't include lemmas < 3 chars
        if len(lemma) < 3:
            continue
        lemmas.append(lemma) # token
    return lemmas

footer_re = re.compile(r'\n-\n#\d+: https?://(?:www\.)?nuswhispers\.com/confession/\d+$')
url_re = re.compile(r'https?://\S+')
def preprocess(text):
    # remove footer, 300+ posts doesnt have this specific footer: df[-df['text'].str.contains(r'\n-\n#\d+: https?://(?:www\.)?nuswhispers\.com/confession/\d+$')]
    text = footer_re.sub('', text)
    # remove all urls
    text = url_re.sub('', text)
    # lower case
    text = text.lower()
    text = ' '.join(tokenize(text))
    return text

def apply_preprocess(df):
    return df.apply(preprocess)

def corpus_to_top_terms(vectorizer, corpus, topk, mindf=0.0, maxdf=1.0):
    '''Calculate the most commonly occuring terms for post text corpus using tf-idf (term frequency inverse document frequency)

    :param df: the posts dataframe
    :param topk: get the only the highest k number of terms, does not guarantee the same score and ordering with different k (details below)
    :param mindf: min document frequency, appear at least in this percentage of documents (dataframe rows), or can be integers number of documents
    :param maxdf: max document frequency, appear at most in this percentage of documents (dataframe rows), or can be integers number of documents
    :returns: dict of terms to its score, sorted descending by score

    With the same df:
        - topk=8 produce {'girl': 26.085, 'time': 22.387, 'people': 22.029, 'guy': 19.082, 'nus': 16.726, 'year': 15.67, 'good': 13.199, 'friend': 12.945}
        - topk=9 produce {'girl': 25.94, 'time': 22.057, 'people': 20.329, 'guy': 18.56, 'nus': 16.319, 'year': 15.469, 'friend': 12.832, 'good': 12.357, 'student': 12.027}
        - notice the scores of 'good' and 'friend' are swapped
    '''
    # src https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html
    # https://jonathansoma.com/lede/image-and-sound/text-analysis/text-analysis-word-counting-lemmatizing-and-tf-idf/ helps to understand tfidf
    # corpus = df['text'].tolist()
    # vectorizer = TfidfVectorizer(analyzer='word', preprocessor=preprocess, tokenizer=tokenize, max_features=topk, ngram_range=(1,2), min_df=mindf, max_df=maxdf)
    start = datetime.now()
    vecs = vectorizer.transform(corpus)
    end = datetime.now()
    logger.info('transform took %s', end-start)
    start = datetime.now()
    terms = vectorizer.get_feature_names_out()
    # term_scores = {term: [] for term in terms}
    term_score = {}
    # manually sum using sparse matrix to prevent OOM, src https://stackoverflow.com/a/56713677/4858751
    # vecs.todense() and vecs.toarray() will use very high mem cos it creates a len(corpus) * len(terms) size 2d array
    # caused OOM in google colab with 12gb ram when ran on corpus_all without preprocess, tokenize, max_features:
    # len(corpus_all)=56213, len(terms)=1580490, 56213 * 1580490 = 88844084370 bytes = 88.8 gb
    for doc in vecs:
        for term_i, score in zip(doc.indices, doc.data):
            if terms[term_i] not in term_score:
                term_score[terms[term_i]] = score
                continue
            term_score[terms[term_i]] += score
            # term_scores[terms[term_i]].append(score)
    # for term in terms:
    #     score = round(sum(term_scores[term]), 3)
    #     if score > 0:
    #         term_score[term] = score
    end = datetime.now()
    logger.info('score took %s', end-start)
    start = datetime.now()
    # get only the topk terms
    term_score_sorted = dict(kv for i, kv in enumerate(sorted(term_score.items(), key=lambda kv: kv[1], reverse=True)) if i < topk)
    # possible optimization but no noticeable impact, get top k elements, O(n + k log k), src https://stackoverflow.com/a/23734295/4858751
    # will have slightly different result compared to the above sorting method for terms with equal scores
    # term_score_sorted = {}
    # kvs = [[k,v] for k, v in term_score.items()]
    # vs = np.array(list(term_score.values()))
    # top_indices = np.argpartition(vs, -topk)[-topk:]
    # for i in top_indices[np.argsort(vs[top_indices])][::-1]:
    #     term_score_sorted[kvs[i][0]] = kvs[i][1]

    end = datetime.now()
    logger.info('sort took %s', end-start)
    return term_score_sorted


def gen_top_terms():
    '''Generate top 10 terms occuring in posts per week'''
    topk = int(len(df) * 1)
    maxdf = 0.2 # exclude too frequently occuring terms like 'time' and 'people', pros: top terms looks more relevant and interesting when there is viral/seasonal topics, cons: may miss out any terms that are too viral
    mindf = 0.0 # exclude too infrequently occuring terms, pros: lesser features -> faster sort, cons: may miss out some tiny viral terms if the viral period has few confessions

    start = datetime.now()
    # load generated corpus json (unused)
    # corpus_all = []
    # with open(f'analyzer-output/top-terms/corpus-all.json') as f:
    #     corpus_all = json.load(f)

    # generate corpus as json (unused)
    # corpus_all = df['text'].tolist()
    # preprocessed_futures = []
    # with ProcessPoolExecutor() as executor:
    #     for i, doc in enumerate(corpus_all):
    #         preprocessed_futures.append(executor.submit(preprocess, doc))
    #     for i, preprocessed_future in enumerate(preprocessed_futures):
    #         corpus_all[i] = preprocessed_future.result()
    # save_file(json.dumps(corpus_all), f'top-terms/corpus-all.json')

    # load generated corpus csv (for faster debugging, uncomment this and comment the generating script below)
    # corpus_all = pd.read_csv(f'analyzer-output/top-terms/corpus-all.csv', index_col=0, na_filter=False).squeeze('columns')
    # corpus_all.describe()
    # corpus_all.info()

    # generate corpus as csv
    corpus_all = df['text']
    with ProcessPoolExecutor() as executor:
        df_split = np.array_split(df['text'], executor._max_workers)
        applied = list(executor.map(apply_preprocess, df_split))
        corpus_all = pd.concat(applied)
    # csv = corpus_all.to_csv()
    # save_file(csv, f'top-terms/corpus-all.csv')

    end = datetime.now()
    logger.info('preprocess took %s', end-start)
    # exit(0)
    vectorizer = TfidfVectorizer(analyzer='word', max_features=topk, ngram_range=(1,2), min_df=mindf, max_df=maxdf)
    start = datetime.now()
    vectorizer.fit(corpus_all)
    end = datetime.now()
    logger.info('fit took %s', end-start)
    # save_file(json.dumps(vectorizer.get_feature_names_out().tolist(), indent=2), f'top-terms/features-{topk}-{mindf}-{maxdf}.json')
    logger.info('terms count %d', len(vectorizer.get_feature_names_out()))
    # exit(0)
    # run normally
    start = datetime.now()
    interval_term_score = {}
    # explanation on closed and label params https://stackoverflow.com/a/48342103/4858751
    for interval, df_slice in df.resample('W', on='post_time', closed='left', label='left'):
        # corpus = corpus_all[df_slice.iloc[0]['no']:df_slice.iloc[-1]['no']+1]
        corpus = corpus_all.loc[df_slice.index]
        interval_term_score[str(interval.date())] = corpus_to_top_terms(vectorizer, corpus, 10, mindf, maxdf)
    end = datetime.now()
    # exit(0)
    logger.info('transform all df_slice took %s', end-start)
    # run parallel
    # interval_futures = {}
    # interval_term_score = {}
    # with ProcessPoolExecutor() as executor:
    #     for interval, df_slice in df.resample('W', on='post_time'):
    #         # corpus = df_slice['text'].tolist()
    #         corpus = corpus_all[df_slice.iloc[0]['no']:df_slice.iloc[-1]['no']+1]
    #         interval_futures[interval] = executor.submit(corpus_to_top_terms, vectorizer, corpus, 10, mindf, maxdf)
    #     for interval, future_term_score in interval_futures.items():
    #         interval_term_score[str(interval.date())] = future_term_score.result()
    # save_file(json.dumps(interval_term_score, indent=2), f'top-terms/terms-{topk}-{mindf}-{maxdf}.json')
    save_file(json.dumps(interval_term_score, indent=2), f'top-terms/terms.json')

def gen_networks():
    '''Generate posts mentions network, save the biggest subgraphs and longest chains'''
    cid = df['cid'].to_frame()
    # to_numeric converts to float64 due to instances of NaN, src https://stackoverflow.com/a/21290084/4858751
    cid['cid'] = pd.to_numeric(cid['cid'])
    print('len cid', len(cid))

    # adj is the list of all identifiable cids in the text
    adj = df['text'].str.extractall(r'#([1-9]\d{2,})\b') # first 100 posts don't have confession id, helps filter out ids starting with 0 and ids with < 3 digits
    adj.index.names = ['no', 'match']
    adj.columns = ['adj']
    # converts to int64
    adj['adj'] = pd.to_numeric(adj['adj'])
    print('len adj', len(adj))

    # cid_adj represents the list of post cid and the cids it mentions, eg if post #3 mentions post #1 and #2, then there will be cid=3,adj=1 and cid=3,adj=2
    # basically an adjacency list based on post mentions, which forms a disjoint union of DAGs, most of which has size of 1 (ie only 1 edge, meaning 1 mention)
    cid_adj = cid.merge(adj, left_index=True, right_on='no', how='inner')
    # the mentioned posts must be older than current post to be valid, ie adj must be < cid
    cid_adj = cid_adj[cid_adj['adj'] < cid_adj['cid']].drop_duplicates()
    # convert to int64 cos cid_adj['cid'] is still float64 type
    cid_adj['cid'] = cid_adj['cid'].astype('int64')
    # remove adj that does not exist either cos post got deleted hence not scraped or post id is too old (cid < 382) that the text does not include the cid
    cid_adj = cid_adj[cid_adj['adj'].isin(cid['cid'])]
    print('len cid_adj', len(cid_adj))

    # mentioned cids that doesn't mention any cid are root nodes
    roots = cid_adj[~cid_adj['adj'].isin(cid_adj['cid'])]['adj'].unique()
    print('len roots', len(roots))
    # single rooted DAGs (there's no common name for it https://cs.stackexchange.com/questions/67849/what-do-you-call-a-dag-with-a-single-root-source)
    rdags = []
    dfs_stack = []
    # for each root, DFS on the posts that mentioned said root
    for root in roots:
        nodes = set()
        edges = set()
        dfs_stack.append((root, 0, []))
        longest_path = []
        while len(dfs_stack) > 0:
            curr_adj, curr_depth, path = dfs_stack.pop() # pop removes last, so this behaves like a stack
            nodes.add(curr_adj)
            if len(path) > len(longest_path):
                longest_path = path
            cids = cid_adj[cid_adj['adj'] == curr_adj]['cid'].to_numpy()
            edges = edges.union((curr_adj, cid) for cid in cids)
            dfs_stack.extend((cid, curr_depth+1, [*path, cid]) for cid in cids) # extend add to last
        rdags.append([root, ','.join(str(i) for i in sorted(nodes)), len(nodes), json.dumps(sorted(edges), default=np_encoder, separators=(',',':')), len(edges), ','.join(str(i) for i in longest_path), len(longest_path)])
    rdags_df = pd.DataFrame(rdags, columns=['root','nodes','nodes_count','edges','edges_count','longest_path','longest_path_length'])
    print('len rdags', len(rdags_df))

    topk = 10
    biggest_rdags_df = rdags_df.nlargest(topk, columns=['nodes_count','root'])
    csv = biggest_rdags_df.to_csv(index=False)
    save_file(csv, f'top-networks/biggest.csv')
    # reverse lookup to find the posts' content
    biggest_rdags_nodes = [int(node) for nodes in biggest_rdags_df['nodes'] for node in nodes.split(',')]
    biggest_rdags_cids = cid[cid['cid'].isin(biggest_rdags_nodes)]
    biggest_rdags_posts_df = df.loc[biggest_rdags_cids.index]
    csv = biggest_rdags_posts_df.to_csv(index=False)
    save_file(csv, f'top-networks/biggest-posts.csv')

    longest_rdags_df = rdags_df.nlargest(topk, columns=['longest_path_length','root'])
    csv = longest_rdags_df.to_csv(index=False)
    save_file(csv, f'top-networks/longest.csv')
    longest_rdags_nodes = [int(node) for nodes in longest_rdags_df['nodes'] for node in nodes.split(',')]
    longest_rdags_cids = cid[cid['cid'].isin(longest_rdags_nodes)]
    longest_rdags_posts_df = df.loc[longest_rdags_cids.index]
    csv = longest_rdags_posts_df.to_csv(index=False)
    save_file(csv, f'top-networks/longest-posts.csv')

def gen_all():
    gen_top_posts()
    gen_posts_freq()
    gen_metrics_distribution()
    gen_metrics_medians()
    gen_top_terms()
    gen_networks()

# def bundle_all():
#     data = {}
#     file_paths = glob.glob('analyzer-output/**/*')
#     for file_path in file_paths:
#         subdir = file_path.split('/')[1]
#         filename = file_path.split('/')[-1]
#         content = open(file_path).read()
#         if subdir not in data:
#             data[subdir] = {}
#         data[subdir][filename] = content
#     save_file(json.dumps(data), f'bundled.json')

if __name__ == '__main__':
    gen_top_posts()
