import { connectToDatabase } from "../../util/mongodb";

export default async (req, res) => {
  const { db } = await connectToDatabase();
  const notes = db.collection("notes");
  const cont = req.body.content;
  const tags = req.body.tags;
  const wTags = req.body.wTags;
  const doc = {
    content: cont,
    tags: tags,
    wTags: wTags};

  return new Promise((resolve, reject) => {
    notes.insertOne(doc)
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
