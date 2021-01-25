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
  const notes = db.collection("notes");
  const cont = req.body.content;
  const tags = req.body.tags;
  const wRecs = req.body.wRecs;
  const _id = req.body._id;
  var ObjectId = require('mongodb').ObjectId;
  const objid = new ObjectId();
  const doc = {
    _id: objid,
    content: cont,
    tags: tags,
    wRecs: wRecs};

  return new Promise((resolve, reject) => {
    notes.insertOne(doc)
      .then(response => {
        res.statusCode = 200;
        res.json(objid);
        resolve();
      })
      .catch(err => {
        console.log('Mongo error: ', err);
        res.json(err);
        return resolve();
      });
  });
};
