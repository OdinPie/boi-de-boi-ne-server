const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors({
  // origin: ['http://localhost:5173','http://localhost:5174'],
  origin: ['https://book-exchange-website-7550b.web.app',
  'https://book-exchange-website-7550b.firebaseapp.com'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.get('/', (req, res)=>{
    res.send('boi de boi ne server is running');
})
app.listen(port, ()=>{
    console.log(`listening on port : ${port}`);
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@odinpiesdatabase.beom3yx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken  = async(req,res,next) =>{
  const token = req?.cookies?.token;
  // console.log('middleware token: ',token);
    if(!token){
      console.log('token nai');
        return res.status(401).send({message: 'unauthorized access'})
    }
    jwt.verify(token, process.env.JWT_SECRET, function (err, decoded){
        if(err){
          console.log('ulta palta token');
        return res.status(401).send({message: 'unauthorized access'})
        }
        req.user = decoded;
         next();
   
  })

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db('bdbnDB');
    const serviceCollection = database.collection('serviceCollection');
    const bookingCollection = database.collection('bookingCollection');
    const userCollection = database.collection('userCollection');


    //auth related api

    app.post('/jwt', async(req,res)=>{
      const user = req.body;
      const token = jwt.sign({data: user},`${process.env.JWT_SECRET}`,{expiresIn: '1h'});
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      .send({success: true})
    })

    app.post('/logout', async(req, res)=>{
      const user = req.body;
      res.clearCookie('token', {maxAge: 0})
      .send({success: true})
    })

    app.post('/services', verifyToken, async(req,res)=>{
        const service = req.body;
        const result = await serviceCollection.insertOne(service);
        res.send(result);
    })

    app.get('/services', async(req,res)=>{
      const query = req.query;
        const cursor = await serviceCollection.find(query).toArray();
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

  app.post('/bookings', async(req,res)=>{
    const booking  = req.body;
    const result = await bookingCollection.insertOne(booking);
    res.send(result); 
  })

  app.get('/bookings',verifyToken, async(req,res)=>{
    // console.log('info jar: ', req.query?.data?.email);
    // console.log('je access kortese', req.user?.useremail);
    if(req.query?.data?.email !== req.user?.useremail || req.query?.data?.email !== req.user?.provideremail){
      return res.status(403).send({message: 'forbidden access'}) 
    }
    const query = req.query;
    const cursor = await bookingCollection.find(query).toArray();
    res.send(cursor)
  })

  app.get('/bookings/:id', async(req,res)=>{
    const id = req.params;
    const query = {_id: new ObjectId(id)}
    const cursor = await bookingCollection.find(query).toArray();
    res.send(cursor)
})

  app.delete('/bookings', async(req,res)=>{
    const id = req.body;
    const query = {_id : new ObjectId(id._id)};    
    const result = await bookingCollection.deleteOne(query);
    res.send(result)
  })

  app.get('/search/:hint', async(req, res)=>{
    const {hint} = req.params;
    const regex = new RegExp(`.*${hint}.*`,"i")
    const query = {sname: regex};
    const result = await serviceCollection.find(query).toArray();
    res.send(result);
    
  })

  app.delete('/services', async(req,res)=>{
    const id = req.body;
    const query = {_id : new ObjectId(id._id)};
    const result = await serviceCollection.deleteOne(query);
    res.send(result);
  
  })

  app.post('/users',async(req,res)=>{
    const user = req.body;
    const result = await userCollection.insertOne(user);
    res.send(result);
  })

  app.get('/users', async(req,res)=>{
    const query = req.query;
    const result = await userCollection.find(query).toArray();
    res.send(result);
  })

  app.patch('/services/:id', async(req,res)=>{
    const updatedInfo = req.body;
    const id = req.params;
    const {
      updatedsname,
      updatedspic,
      updatedslocation,
      updatedprice,
      updateddetail} = updatedInfo;

    const filter = {_id: new ObjectId(id)};
    const option = {upsert : true};
    const updateDoc = {
      $set:{
        sname : updatedsname,
        spic : updatedspic,
        slocation : updatedslocation,
        price : updatedprice,
        detail : updateddetail
      }
    }
    const result = await serviceCollection.updateOne(filter, updateDoc,option)
    res.send(result);
  })

  app.patch('/bookings/:id', async(req,res)=>{
    const updatedInfo = req.body;
    const id = req.params;
    const {statusValue} = updatedInfo;

    const filter = {_id: new ObjectId(id)};
    const option = {upsert : true};
    const updateDoc = {
      $set:{
        state : statusValue
      }
    }
    const result = await bookingCollection.updateOne(filter, updateDoc,option)
    res.send(result);
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
