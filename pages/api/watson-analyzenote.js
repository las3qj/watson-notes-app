//Given a single input text string, requests the top 10 keywords mentioned

export default function(req, res){
  const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
  const { IamAuthenticator } = require('ibm-watson/auth');
  const input = req.body.input;

  const nlu = new NaturalLanguageUnderstandingV1({
    version: '2020-08-01',
    authenticator: new IamAuthenticator({
      apikey: '1Pf8MXp-6k5cN7tvSZ8q-23rlOxgmWyKiBchbM0LM_KM',
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
