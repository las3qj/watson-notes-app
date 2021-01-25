import { connect } from "../../util/database";

export default async (req, res) => {
  const { db } = await connect();
  const tagsDB = db.collection("tags");
  const children = req.body.children;
  const parent = req.body.parent;
  var ObjectId = require('mongodb').ObjectId;
  const objid = new ObjectId();
  const name = req.body.name;
  const doc = {
    _id: objid,
    name: name,
    children: children,
    parent: parent
  };
  console.log(doc);

  return new Promise((resolve, reject) => {
    tagsDB.insertOne(doc)
      .then(response => {
        res.statusCode = 200;
        console.log("start");
        res.json(objid);
        console.log("Success");
        resolve();
      })
      .catch(err => {
        console.log('Mongo error: ', err);
        res.json(err);
        return resolve();
      });
  });
};
