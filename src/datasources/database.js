import { MongoClient } from 'mongodb';

// Database connection
const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost/27017/', { useNewUrlParser: true });
        const db = client.db('blog-tutorial');

        await operations(db);

        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to Database', error });
    }
};

export default withDB;