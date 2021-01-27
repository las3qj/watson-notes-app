import { runMiddleware, connect, sessionUserId } from "../../util/database";
import Cors from 'cors'

// Initializing the cors middleware
const cors = Cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'POST', 'DELETE'],
})

export default async (req, res) => {
  await runMiddleware(req, res, cors);
  const userid = await sessionUserId(req);
  const { db } = await connect();
  const tagsDB = db.collection("tags");
  const _id = req.body._id;
  var ObjectId = require('mongodb').ObjectId;
  const objid = new ObjectId(_id);

  const query = {
    _id: objid,
    userid: userid
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
