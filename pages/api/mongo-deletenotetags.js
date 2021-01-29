import { runMiddleware, connect, sessionUserId } from "../../util/database";
import Cors from 'cors';

// Initializing the cors middleware
const cors = Cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'POST', 'DELETE'],
})

export default async (req, res) => {
  await runMiddleware(req, res, cors);
  const userid = await sessionUserId(req);

  const { db } = await connect();
  const tagsDB = db.collection("notes");
  var ObjectId = require('mongodb').ObjectId;
  const id = req.body._id;
  const objid = new ObjectId(id);

  const query = {userid: userid};
  var update = {
    $pull: {
      tags: id
    }
  };
  const options = {multi: 'true'};
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
