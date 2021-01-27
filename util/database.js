import { MongoClient } from 'mongodb';
import { getSession } from 'next-auth/client';
import Cors from 'cors';

const client = new MongoClient(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function connect() {
    if(!client.isConnected()){
       await client.connect();
    }
    const db = client.db("WatsonNotesApp");
    return {db, client};
}

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

async function sessionUserId(req){
  const session = await getSession({ req });
  if(!session){
    return "demo";
  }
  else{
    const { db } = await connect();
    const sessiondb = db.collection("sessions");
    const sessAT = session.accessToken;
    const query = {accessToken: sessAT};
    const options = {projection: {userId: 1}};
    const res = await sessiondb.findOne(query, options)
    .catch(()=>console.log("error in fetching id"));
    return (res.userId);
  }
}

export { connect, runMiddleware, sessionUserId };
