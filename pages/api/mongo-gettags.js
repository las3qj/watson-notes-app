import { connectToDatabase } from "../../util/mongodb";

export default async (req, res) => {
  const { db } = await connectToDatabase();
  const tagsDB = db.collection("tags");
  const query = {};
  const options = {
    sort: { _id: 1 }
  };

  const cursor = await tagsDB.find(query, options);
  const arr = await cursor.toArray();
  res.statusCode = 200;
  res.end(JSON.stringify(await arr));
};
