import { runMiddleware, connect, sessionUserId } from "../../util/database";
import Cors from 'cors'

// Initializing the cors middleware
const cors = Cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'POST'],
})

export default async (req, res) => {
  await runMiddleware(req,res,cors);
  const userid = await sessionUserId(req);
  const { db } = await connect();
  const tagsDB = db.collection("notes");
  const tag = req.body.tag;
  const query = {
    userid: userid,
    tags: {
      $in: [tag]
    }
  };
  const options = {};

  const cursor = await tagsDB.find(query, options);
  const arr = await cursor.toArray();
  res.statusCode = 200;
  res.end(JSON.stringify(await arr));
};
