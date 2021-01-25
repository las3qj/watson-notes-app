import { connect } from "../../util/database";

export default async (req, res) => {
  const { db } = await connect();
  const tagsDB = db.collection("notes");
  const tag = req.body.tag;
  const query = {
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
