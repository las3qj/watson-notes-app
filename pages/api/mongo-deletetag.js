import { connect } from "../../util/database";

export default async (req, res) => {
  const { db } = await connect();
  const tagsDB = db.collection("tags");
  const _id = req.body._id;
  var ObjectId = require('mongodb').ObjectId;
  const objid = new ObjectId(_id);

  const query = {
    _id: objid
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
