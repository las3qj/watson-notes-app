import { connectToDatabase } from "../../util/mongodb";

export default async (req, res) => {
  const { db } = await connectToDatabase();
  const tagsDB = db.collection("tags");
  const _id = req.body._id;
  const children = req.body.children;
  const notes = req.body.notes;
  const parent = req.body.parent;
  const doc = {
    _id: _id,
    children: children,
    notes: notes,
    parent: parent
  };

  return new Promise((resolve, reject) => {
    tagsDB.insertOne(doc)
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
