import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = (async () => {
      try {
        console.log('Attempting to connect to MongoDB...');
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db('admin').command({ ping: 1 });
        console.log('Pinged your deployment. You successfully connected to MongoDB!');
        return client;
      } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        // In development, it's useful to see the error but not crash the app
        // We will return a promise that rejects, but the app might not handle this gracefully everywhere.
        // The important part is the clear error log.
        return Promise.reject(error);
      }
    })();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = (async () => {
    try {
      await client.connect();
      await client.db('admin').command({ ping: 1 });
      return client;
    } catch (error) {
      console.error('Failed to connect to MongoDB in production', error);
      throw new Error('Database connection failed!');
    }
  })();
}

export default clientPromise;
