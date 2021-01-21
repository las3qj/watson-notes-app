import { connectToDatabase } from "../../util/mongodb";

export default async (req, res) => {
  const { db } = await connectToDatabase();
  const tagsDB = db.collection("tags");
  const _id = req.body._id;
  var ObjectId = require('mongodb').ObjectId;
  const objid = new ObjectId(_id);

  const query = {
    _id: _id
  };

  return new Promise((resolve, reject) => {
    tagsDB.deleteOne(query)
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
