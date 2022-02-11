import express from 'express';
import bodyParser from 'body-parser';
import withDB from './datasources/database';

const app = express();

app.use(bodyParser.json());

// get article
app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(articleInfo);
    }, res); 
});

// get articles
app.get('/api/articles', async (req, res) => {
    withDB(async (db) => {
        const articles = await db.collection('articles').find().toArray();
        res.status(200).json(articles);
    }, res); 
});

// get most recent articles
app.get('/api/articles/recent/articles', async (req, res) => {
    withDB(async (db) => {
        const articles = await db.collection('articles').find().sort({$natural:-1}).limit(3).toArray();
        res.status(200).json(articles);
    }, res); 
});

// get article suggestions
app.post('/api/articles/suggestions', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.body.articleName;
        const articles = await db.collection('articles').find({ name : { $ne: articleName }}).limit(2).toArray();
        res.status(200).json(articles);
    }, res);
});

// create article
app.post('/api/articles', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.body.articleName;
        const articleText = [req.body.text];
        const articleUpvotes = 0;
        const articleComments = [];
        const category = req.body.category;

        const data = {
            name: articleName,
            upvotes: articleUpvotes,
            comments: articleComments,
            content: articleText,
            timestamp: Date.now(),
            category: category
        };
        
        await db.collection('articles').insertOne(data);

        const updatedArticles = await db.collection('articles').find({});

        res.status(200).json(updatedArticles);
    }, res);
});

// filter articles by category
app.post('/api/articles/filter-categories', async (req, res) => {
    withDB(async (db) => {
        const categoryName = req.body.articleCategory;
        if(categoryName){
            const articles = await db.collection('articles').find({ category : { $eq: categoryName }}).limit(10).toArray();
            res.status(200).json(articles);
        } else {
            const articles = await db.collection('articles').find().limit(10).toArray();
            res.status(200).json(articles);
        }
    }, res);
});

// delete an article
app.delete('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const articles = await db.collection('articles').deleteOne({ name: articleName });
        res.status(200).json(articles);
    }, res);
});

// upvote
app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, 
            { '$set': { 
                upvotes: articleInfo.upvotes + 1
            },
        });
        const updatedArticle = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticle);
    }, res);
});

// comment
app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;
    
    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, 
            { '$set': {
                comments: articleInfo.comments.concat({ username, text })
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticleInfo);
    }, res);
});

// get comments
app.get('/api/articles/:name/comments', (req, res) => {
    const articleName = req.params.name;
    
    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(articleInfo.comments);
    }, res);
});

app.listen(8000, () => console.log('Listening on port 8000'));