import { connect } from "../../util/database";

export default async (req, res) => {
  const { db } = await connect();
  const tagsDB = db.collection("tags");
  const prevP = req.body.prevP;
  const newP = req.body.newP;

  const query = {
    parent: prevP
  };
  var update = {
    $set: {
      parent: newP
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
