const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: 'us-east-1' });
const db = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

const getPresets = require('./lib/getPresets');
const parseMetadata = require('./lib/parseMetadata');

module.exports.handler = async (event) => {
  // console.log(JSON.stringify(event, null, 2));

  for (const { body } of event.Records) {
    const { Records } = JSON.parse(body);
    for (const { s3 } of Records) {
      const bucket = s3.bucket.name;
      const videoId = s3.object.key.split('/')[1];
      const filename = s3.object.key.split('/')[2];

      const [audioRes, metadataRes, segmenterRes] = await Promise.all([
        lambda
          .invoke({
            InvocationType: 'RequestResponse',
            FunctionName: process.env.AUDIO_EXTRACTOR_FN_NAME,
            Payload: Buffer.from(
              JSON.stringify({
                ffmpeg_cmd: `-vn -c:a libopus -f opus`,
                out_path: `s3://${bucket}/audio/${videoId}/source.ogg`,
                in_path: `s3://${bucket}/uploads/${videoId}/${filename}`,
              })
            ),
          })
          .promise(),
        lambda
          .invoke({
            InvocationType: 'RequestResponse',
            FunctionName: process.env.METADATA_FN_NAME,
            Payload: Buffer.from(
              JSON.stringify({
                in_path: `s3://${bucket}/uploads/${videoId}/${filename}`,
              })
            ),
          })
          .promise(),
        lambda
          .invoke({
            InvocationType: 'RequestResponse',
            FunctionName: process.env.SEGMENTER_FN_NAME,
            Payload: Buffer.from(JSON.stringify({ videoId, filename })),
          })
          .promise(),
      ]);

      const segments = JSON.parse(segmenterRes.Payload);
      const transcoded = segments.reduce((acc, cv) => {
        const segName = cv.Key.split('/').pop();
        acc[segName] = false;
        return acc;
      }, {});

      const { width } = parseMetadata(metadataRes.Payload);
      const presets = getPresets(width);

      // console.log('segments', segments);
      // console.log('presets', presets);

      await Promise.all(
        presets.map(({ presetName, ffmpegCmdStr }) => {
          return db
            .put({
              TableName: 'tidal-dev',
              Item: {
                id: videoId,
                preset: presetName,
                cmd: ffmpegCmdStr,
                createdAt: Date.now(),
                modifiedAt: Date.now(),
                status: 'segmented',
                segments: segments.length,
                transcoded,
              },
            })
            .promise();
        })
      );
    }
  }
};
