import { connectToDatabase } from "../../util/mongodb";

export default async (req, res) => {
  const { db } = await connectToDatabase();
  const tagsDB = db.collection("notes");
  var ObjectId = require('mongodb').ObjectId;
  const id = req.body._id;
  const objid = new ObjectId(id);

  const query = {};
  var update = {
    $pull: {
      tags: id
    }
  };
  const options = {multi: 'true'};
  console.log("u: ", update);
  return new Promise((resolve, reject) => {
    tagsDB.updateMany(query, update, options)
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
