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
const Artifactscollection1 = client.db('Legacy-Vault').collection('Artifacts');
const Artifactscollection2 = client.db('Legacy-Vault').collection('Historical Timeline');





app.post("/addartifacts", async (req, res) => {
      try {
        const newArtifact = req.body;
        const result = await Artifactscollection1.insertOne(newArtifact);
        res.status(201).json({
          success: true,
          message: "Artifact added successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Failed to add artifact",
          error: error.message,
        });
      }
    });





app.get('/historical_timeline' ,async (req,res)=>{
    const cursor = Artifactscollection2.find();
    const result = await cursor.toArray();
    res.send(result)
})


app.get('/artifacts' ,async (req,res)=>{
    const cursor = Artifactscollection1.find();
    const result = await cursor.toArray();
    res.send(result)
})

// like oparetion start

app.patch('/artifacts/like/:id', async (req, res) => {
  const artifactId = req.params.id;
  const userEmail = req.body.email;

  if (!userEmail) {
    return res.status(400).send({ message: 'Email is required' });
  }

  const query = { _id: new ObjectId(artifactId) };
  const artifact = await Artifactscollection1.findOne(query);

  if (!artifact) {
    return res.status(404).send({ message: 'Artifact not found' });
  }

  const alreadyLiked = artifact.liked_by?.includes(userEmail);

  let updateDoc;
  if (alreadyLiked) {
    // Remove like
    updateDoc = {
      $pull: { liked_by: userEmail }
    };
  } else {
    // Add like
    updateDoc = {
      $addToSet: { liked_by: userEmail }
    };
  }

  const result = await Artifactscollection1.updateOne(query, updateDoc);
  res.send(result);
});



// like oparetion end


const { ObjectId } = require('mongodb'); 

app.get('/artifacts/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const artifact = await Artifactscollection1.findOne(query);
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