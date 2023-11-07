const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
//BookAdmin
//OB2HduJbvc9GFk2k
app.use(cors());
app.use(express.json());

app.get('/', (req, res)=>{
    res.send('boi de boi ne server is running');
})
app.listen(port, ()=>{
    console.log(`listening on port : ${port}`);
})


const uri = "mongodb+srv://BookAdmin:OB2HduJbvc9GFk2k@odinpiesdatabase.beom3yx.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db('bdbnDB');
    const serviceCollection = database.collection('serviceCollection');

    app.post('/services', async(req,res)=>{
        const service = req.body;
        const result = await serviceCollection.insertOne(service);
        res.send(result);
    })

    app.get('/services', async(req,res)=>{
        const cursor = await serviceCollection.find().toArray();
        res.send(cursor);
    })

    app.get('/services/:id', async(req,res)=>{
      const id = req.params;
      const query = {_id: new ObjectId(id)}
      const cursor = await serviceCollection.find(query).toArray();
      res.send(cursor)
  })

    app.get('/popularservices', async(req,res)=>{
      const cursor = await serviceCollection.find().limit(5).toArray();
      res.send(cursor);
  })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
