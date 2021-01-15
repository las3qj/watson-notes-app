import { connectToDatabase } from "../../util/mongodb";

export default async (req, res) => {
  const { db } = await connectToDatabase();
  const tagsDB = db.collection("tags");
  const id = req.body._id;
  const children = req.body.children;
  const notes = req.body.notes;
  const parent = req.body.parent;

  const query = {
    _id: id
  };
  var update = {
    $set: {
      children: children,
      notes: notes,
      parent: parent
    }
  };
  return new Promise((resolve, reject) => {
    tagsDB.updateOne(query, update)
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
