import { connect } from "../../util/database";

export default async (req, res) => {
  const { db } = await connect();
  const tagsDB = db.collection("tags");
  const id = req.body._id;
  const children = req.body.children;
  const name = req.body.name;
  const parent = req.body.parent;
  var ObjectId = require('mongodb').ObjectId;
  const objid = new ObjectId(id);

  const query = {
    _id: objid
  };
  var update = {
    $set: {
      name: name,
      children: children,
      parent: parent
    }
  };
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
