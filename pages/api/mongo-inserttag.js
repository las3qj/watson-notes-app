import { connect } from "../../util/database";
import Cors from 'cors'

// Initializing the cors middleware
const cors = Cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'POST'],
})

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}

export default async (req, res) => {
  await runMiddleware(req,res,cors);
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
