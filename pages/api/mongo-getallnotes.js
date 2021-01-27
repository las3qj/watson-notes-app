import { runMiddleware, connect, sessionUserId } from "../../util/database";
import Cors from 'cors'

// Initializing the cors middleware
const cors = Cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'POST'],
});

export default async (req, res) => {
  try {
    await runMiddleware(req, res, cors);
    const userid = await sessionUserId(req);
    const { db } = await connect();
    const notesDB = db.collection("notes");
    const sBy = req.body;
    const sortBy = sBy? sBy : "_id";
    const query = {userid: userid};
    const options = {
      sort: { [sortBy]: 1 }
    };

    const cursor = await notesDB.find(query, options);
    const arr = await cursor.toArray();
    res.statusCode = 200;
    res.end(JSON.stringify(await arr));
  } catch(e) {
    res.status(500);
    console.log("error, unable to get notes");
  }
};
