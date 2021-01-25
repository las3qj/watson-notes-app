import { connectToDatabase } from "../../util/mongodb";
import Cors from 'cors';

// Initializing the cors middleware
const cors = Cors({
  origin: "*",
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
  await runMiddleware(req, res, cors);

  const { db } = await connectToDatabase();
  const tagsDB = db.collection("tags");
  const query = {};
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
