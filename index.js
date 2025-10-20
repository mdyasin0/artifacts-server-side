require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");
app.use(
  cors({
    origin: ["http://localhost:5173", "https://assignment-11-1588b.web.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieparser());

const verifyuser = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log("cookie in the middlewire", token);
  if (!token) {
    return res.status(401).send({ massage: "unauthorized access" });
  }
  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ massage: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.USER}:${process.env.DB_PASS}@cluster0.vbsgl0h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Legacy-Vault  Artifacts
    const Artifactscollection1 = client
      .db("Legacy-Vault")
      .collection("Artifacts");
    const Artifactscollection2 = client
      .db("Legacy-Vault")
      .collection("Historical Timeline");

    // jwt api

    app.post("/jwt", async (req, res) => {
      const { email } = req.body;
      const user = { email };
      const token = jwt.sign(user, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "1h",
      });

      res.cookie("token", token, {
        // httpOnly:true,
        // // secure:false,
        // secure: process.env.NODE_ENV === "production",
        // sameSite:'None'

        // httpOnly: true,
        // secure: process.env.NODE_ENV === "production",
        // sameSite: process.env.NODE_ENV === "production" ? 'None' : 'Lax',

        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      });

      res.send({ success: true });
    });

    // MongoDB Collection
    const NotesCollection = client.db("Legacy-Vault").collection("Notes");

    //  Save Note (No JWT)
    app.post("/notes", async (req, res) => {
      const { email, title, content } = req.body;

      if (!email || !title || !content) {
        return res.status(400).send({ message: "All fields are required!" });
      }

      const newNote = {
        email,
        title,
        content,
        date: new Date(),
      };

      try {
        const result = await NotesCollection.insertOne(newNote);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to save note!" });
      }
    });

    //  Get All Notes (No JWT)
    app.get("/notes", async (req, res) => {
      try {
        const notes = await NotesCollection.find({})
          .sort({ date: -1 })
          .toArray();
        res.send(notes);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch notes!" });
      }
    });

    // Get Single Note
    app.get("/notes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const note = await NotesCollection.findOne({ _id: new ObjectId(id) });
        if (!note) return res.status(404).send({ message: "Note not found" });
        res.send(note);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch note!" });
      }
    });

    //  Update Note
    app.patch("/notes/:id", async (req, res) => {
      const id = req.params.id;
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).send({ message: "All fields required!" });
      }

      try {
        const result = await NotesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { title, content } }
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to update note!" });
      }
    });

    //  Delete Note
    app.delete("/notes/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await NotesCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to delete note!" });
      }
    });

    // Artifacts form

    app.post("/addartifacts", verifyuser, async (req, res) => {
      try {
        const newArtifact = req.body;
        const email = req.body.email;

        if (email !== req.decoded.email) {
          return res.status(403).send({ massage: "forbidden access" });
        }
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

    // delete operation for artifacts
    app.delete("/delete/:id", verifyuser, async (req, res) => {
      try {
        const email = req.decoded.email;
        if (email !== req.decoded.email) {
          return res.status(403).send({ massage: "forbidden access" });
        }
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await Artifactscollection1.deleteOne(query);

        if (result.deletedCount === 1) {
          res.status(200).json({
            success: true,
            message: "Artifact deleted successfully",
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Artifact not found",
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Failed to delete artifact",
          error: error.message,
        });
      }
    });

    app.get("/historical_timeline", async (req, res) => {
      const cursor = Artifactscollection2.find();
      console.log("inside timline", req.cookies);

      const result = await cursor.toArray();
      res.send(result);
    });

    const CommentsCollection = client.db("Legacy-Vault").collection("Comments");
    //  Add Comment
    app.post("/comments", async (req, res) => {
      try {
        const { artifactId, name, email, image, text, date } = req.body;

        if (!artifactId || !name || !email || !text) {
          return res.status(400).send({ message: "Missing required fields" });
        }

        const newComment = {
          artifactId,
          name,
          email,
          image,
          text,
          date: new Date(date),
        };

        const result = await CommentsCollection.insertOne(newComment);
        res.status(201).send({
          success: true,
          message: "Comment added successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to add comment",
          error: error.message,
        });
      }
    });
    // Get Comments by Artifact ID
    app.get("/comments/:artifactId", async (req, res) => {
      try {
        const artifactId = req.params.artifactId;
        const query = { artifactId: artifactId };
        const comments = await CommentsCollection.find(query)
          .sort({ date: -1 })
          .toArray();
        res.send(comments);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch comments",
          error: error.message,
        });
      }
    });

    //  Delete comment (No JWT)
    app.delete("/comments/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { email } = req.body; // frontend থেকে email পাঠাতে হবে

        if (!email)
          return res
            .status(400)
            .send({ success: false, message: "Email required" });

        const result = await CommentsCollection.deleteOne({
          _id: new ObjectId(id),
          email,
        });

        if (result.deletedCount === 1) {
          res.status(200).send({ success: true, message: "Comment deleted" });
        } else {
          res.status(404).send({
            success: false,
            message: "Comment not found or not your comment",
          });
        }
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    //  Update comment (No JWT)
    app.patch("/comments/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { email, text } = req.body;

        if (!email)
          return res
            .status(400)
            .send({ success: false, message: "Email required" });

        const result = await CommentsCollection.updateOne(
          { _id: new ObjectId(id), email },
          { $set: { text } }
        );

        if (result.matchedCount === 1) {
          res.status(200).send({ success: true, message: "Comment updated" });
        } else {
          res.status(404).send({
            success: false,
            message: "Comment not found or not your comment",
          });
        }
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    app.get("/artifacts", async (req, res) => {
      const cursor = Artifactscollection1.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // like oparetion start

    app.patch("/artifacts/like/:id", verifyuser, async (req, res) => {
      const artifactId = req.params.id;
      const userEmail = req.body.email;

      if (userEmail !== req.decoded.email) {
        return res.status(403).send({ massage: "forbidden access" });
      }

      if (!userEmail) {
        return res.status(400).send({ message: "Email is required" });
      }

      const query = { _id: new ObjectId(artifactId) };
      const artifact = await Artifactscollection1.findOne(query);

      if (!artifact) {
        return res.status(404).send({ message: "Artifact not found" });
      }

      const alreadyLiked = artifact.liked_by?.includes(userEmail);

      let updateDoc;
      if (alreadyLiked) {
        // Remove like
        updateDoc = {
          $pull: { liked_by: userEmail },
        };
      } else {
        // Add like
        updateDoc = {
          $addToSet: { liked_by: userEmail },
        };
      }

      const result = await Artifactscollection1.updateOne(query, updateDoc);
      res.send(result);
    });

    // like oparetion end

    // for update form show data

    app.get("/update/:id", verifyuser, async (req, res) => {
      const email = req.decoded.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ massage: "forbidden access" });
      }
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const artifact = await Artifactscollection1.findOne(query);
      res.send(artifact);
    });

    //  update form for update data

    app.patch("/update/:id", verifyuser, async (req, res) => {
      try {
        const email = req.body.email;
        if (email !== req.decoded.email) {
          return res.status(403).send({ massage: "forbidden access" });
        }
        const id = req.params.id;
        const updatedData = req.body;

        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: updatedData,
        };

        const result = await Artifactscollection1.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Artifact not found",
          });
        }

        res.status(200).json({
          success: true,
          message: "Artifact updated successfully",
          modifiedCount: result.modifiedCount,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Failed to update artifact",
          error: error.message,
        });
      }
    });

    //for  home details
    app.get("/artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const artifact = await Artifactscollection1.findOne(query);
      res.send(artifact);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Historical Artifacts server");
});
app.listen(port, () => {
  console.log(`Historical Artifacts server on port ${port}`);
});
