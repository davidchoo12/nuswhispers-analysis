from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import numpy as np
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from wordcloud import WordCloud, STOPWORDS
from starlette.responses import StreamingResponse
from io import BytesIO

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df = pd.read_csv('data.csv')
for col in ['created_at', 'updated_at', 'status_updated_at']:
    df[col] = pd.to_datetime(df[col])
df.set_index('created_at', inplace=True)

stopwords = set(STOPWORDS)


@app.get('/api/stats')
async def stats():
    dff = df.reset_index()
    return {
        'latest': dff.iloc[dff['confession_id'].argmax()]['confession_id'].item(),
        'latest_fbpid': dff.iloc[dff['confession_id'].argmax()]['fb_post_id'].item(),
        'total_approved': len(dff),
        'days': (pd.Timestamp.today() - dff['created_at'].max()).days,
        'most_liked': dff.iloc[dff['fb_like_count'].argmax()]['confession_id'].item(),
        'most_liked_fbpid': dff.iloc[dff['fb_like_count'].argmax()]['fb_post_id'].item(),
        'most_commented': dff.iloc[dff['fb_comment_count'].argmax()]['confession_id'].item(),
        'most_commented_fbpid': dff.iloc[dff['fb_comment_count'].argmax()]['fb_post_id'].item(),
        'high_likes_count': len(dff[dff['fb_like_count'] > 100]),
        'high_comments_count': len(dff[dff['fb_comment_count'] > 100]),
    }


@app.get("/api/frequency")
async def freq(q: str):
    filtered = df[df['content'].str.contains(q, case=False)]
    grouped = filtered.groupby(pd.Grouper(freq='W')).content.count()
    return {
        'x': ((grouped.index - pd.Timestamp("1970-01-01")) // pd.Timedelta('1s')).values.tolist(),
        'y': grouped.values.tolist()
    }


@app.get("/api/wordcloud")
async def wc(q: str):
    filtered = df[df['content'].str.contains(q, case=False)]
    comment_words = ''
    for val in filtered['content']:
        # split the value
        tokens = val.split()
        # Converts each token into lowercase
        for i in range(len(tokens)):
            tokens[i] = tokens[i].lower()
        comment_words += " ".join(tokens) + ' '
    wordcloud = WordCloud(width=1000, height=500,
                          background_color='white',
                          stopwords=stopwords,
                          min_font_size=10).generate(comment_words)
    img = wordcloud.to_image()
    # print('img=%s' % (img.shape,))
    buf = BytesIO()
    img.save(buf, format='PNG')
    # imsave(buf, img, format='JPEG', quality=100)
    buf.seek(0)  # important here!
    return StreamingResponse(buf, media_type="image/png",
                             headers={'Content-Disposition': 'inline; filename="wc.png"'})

app.mount("/", StaticFiles(directory="static"), name="/static")
