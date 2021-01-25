import { connect } from "../../util/database";

export default async (req, res) => {
  const { db } = await connect();
  const tagsDB = db.collection("tags");
  const _id = req.body._id;
  const children = req.body.children;
  const notes = req.body.notes;
  const indices = req.body.indices;
  const root = req.body.root;

  var p = "children";
  for(var n=0; n<(indices.length-1); n++){
    p=p+"."+indices[n]+".children";
  }
  const tag = {
    _id: _id,
    children: children,
    notes: notes,
    root: root,
    indices: indices
  };

  const query = {
    _id: root
  };
  var update = {
    $push: {
      [p]: {
        $each: [tag],
        $sort: {_id: 1}
      }
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
