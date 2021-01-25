import Cors from 'cors';

// Initializing the cors middleware
const cors = Cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'POST'],
})

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

export default async function(req, res){
  await runMiddleware(req,res,cors);

  const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
  const { IamAuthenticator } = require('ibm-watson/auth');
  const input = req.body.input;

  const nlu = new NaturalLanguageUnderstandingV1({
    version: '2020-08-01',
    authenticator: new IamAuthenticator({
      apikey: process.env.WATSON_APIKEY,
    }),
    serviceUrl: 'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/c6cc95f9-4bc6-4db6-af50-ae4cf2c7d4a8',
  });

  const analyzeParams = {
    'text': input,
    'features': {
      'keywords': {
        'limit': 10
      },
      'entities': {
        'limit': 10
      },
      'concepts': {
        'limit': 10
      }
    }
  };

  return new Promise((resolve, reject) => {
    nlu.analyze(analyzeParams)
    .then(analysisResults => {
      res.statusCode=200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(analysisResults, null, 2));
      resolve();
    })
    .catch(err => {
      console.log('Kyw error:', err);
      res.json(err);
      res.status(405).end();
      return resolve();
    });
  });
}
