import { connectToDatabase } from "../../util/mongodb";

export default async (req, res) => {
  const { db } = await connectToDatabase();
  const notes = db.collection("notes");
  const cont = req.body.content;
  const tags = req.body.tags;
  const wRecs = req.body.wRecs;
  const doc = {
    content: cont,
    tags: tags,
    wRecs: wRecs};

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
