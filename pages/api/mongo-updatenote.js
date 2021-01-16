import { connectToDatabase } from "../../util/mongodb";

export default async (req, res) => {
  const { db } = await connectToDatabase();
  const tagsDB = db.collection("notes");
  var ObjectId = require('mongodb').ObjectId;
  const id = req.body._id;
  const objid = new ObjectId(id);
  const content = req.body.content;
  const tags = req.body.tags;
  const wRecs = req.body.wRecs;

  const query = {
    _id: objid
  };
  var update = {
    $set: {
      content: content,
      tags: tags,
      wRecs: wRecs
    }
  };
  console.log("q: ",query);
  console.log("u: ", update);
  return new Promise((resolve, reject) => {
    tagsDB.updateOne(query, update)
      .then(response => {
        res.statusCode = 200;
        res.end();
        resolve();
      })
      .catch(err => {
        console.log('Mongo error: ', err);
        res.json(err);
        return resolve();
      });
  });
};
