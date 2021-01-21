import { connectToDatabase } from "../../util/mongodb";

export default async (req, res) => {
  const { db } = await connectToDatabase();
  const tagsDB = db.collection("notes");
  const sBy = req.body;
  const sortBy = sBy? sBy : "_id";
  const query = {};
  const options = {
    sort: { [sortBy]: 1 }
  };

  const cursor = await tagsDB.find(query, options);
  const arr = await cursor.toArray();
  res.statusCode = 200;
  res.end(JSON.stringify(await arr));
};
