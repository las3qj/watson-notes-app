import { runMiddleware, connect, sessionUserId } from "../../util/database";
import Cors from 'cors';

// Initializing the cors middleware
const cors = Cors({
  origin: "*",
  methods: ['GET', 'HEAD', 'POST'],
});

export default async (req, res) => {
  await runMiddleware(req, res, cors);

  const { db } = await connect();
  const userid = await sessionUserId(req);
  const tagsDB = db.collection("tags");
  const query = {userid: userid};
  const sBy = req.body;
  //FLAG
  const sortBy = sBy?sBy:"name";
  const options = {
    sort: { [sortBy]: 1 }
  };

  const cursor = await tagsDB.find(query, options);
  const arr = await cursor.toArray();
  res.statusCode = 200;
  res.end(JSON.stringify(await arr));
};
