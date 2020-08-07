const axios = require('axios');
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({ region: 'us-east-2' });

const NOMAD_ADDRESS = 'http://localhost:4646' || 'http://10.0.3.87:4646';

module.exports = async function (job, Meta) {
  console.log('NOMAD_ADDRESS', NOMAD_ADDRESS);

  // const { Item } = await db
  //   .get({
  //     TableName: 'config',
  //     Key: { id: 'NOMAD_TOKEN' },
  //   })
  //   .promise();

  const nomadAddr = `${NOMAD_ADDRESS}/v1/job/${job}/dispatch`;
  const res = await axios.post(
    nomadAddr,
    { Meta }
    // {
    //   timeout: 1000 * 10,
    //   headers: {
    //     'X-Nomad-Token': Item.value,
    //   },
    // }
  );

  console.log('nomad response', res);
};