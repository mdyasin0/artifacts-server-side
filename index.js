require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app =express();
const port = process.env.PORT || 3000 ;
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.user}:${process.env.db_pass}@cluster0.vbsgl0h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
// Legacy-Vault  Artifacts
const Artifactscollection = client.db('Legacy-Vault').collection('Artifacts');

app.get('/artifacts' ,async (req,res)=>{
    const cursor = Artifactscollection.find();
    const result = await cursor.toArray();
    res.send(result)
})

const { ObjectId } = require('mongodb'); // খুব গুরুত্বপূর্ণ!

app.get('/artifacts/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const artifact = await Artifactscollection.findOne(query);
  res.send(artifact);
});

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res) =>{
    res.send('Historical Artifacts server')
});
 app.listen(port ,()=>{
    console.log(`Historical Artifacts server on port ${port}`);
 });