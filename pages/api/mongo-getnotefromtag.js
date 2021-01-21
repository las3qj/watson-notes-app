import { connectToDatabase } from "../../util/mongodb";

export default async (req, res) => {
  const { db } = await connectToDatabase();
  const tagsDB = db.collection("notes");
  const tag = req.body.tag;
  var ObjectId = require('mongodb').ObjectId;
  const objid = new ObjectId(tag);
  const query = {
    tags: {
      $in: [objid]
    }
  };
  const options = {};

  const cursor = await tagsDB.find(query, options);
  const arr = await cursor.toArray();
  res.statusCode = 200;
  res.end(JSON.stringify(await arr));
};
