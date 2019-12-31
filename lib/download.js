const path = require('path');
const uuid = require('uuid');
const fs = require('fs-extra');
const s3 = require('../config/s3');

module.exports = async (videoId) => {
  return new Promise(async (resolve, reject) => {
    const sourceDir = path.resolve(`./tmp/${uuid()}`);
    await fs.mkdirp(sourceDir);

    try {
      const sourcePath = path.resolve(`${sourceDir}/source.mp4`);
      const writer = fs.createWriteStream(sourcePath);

      s3.getObject({
        Bucket: 'media-bken',
        Key: `${videoId}/source.mp4`,
      })
        .createReadStream()
        .on('error', reject)
        .pipe(writer);

      writer.on('close', () => {
        console.log('Download complete!');
        resolve({ sourceDir, sourcePath });
      });
    } catch (error) {
      console.error(error);
      await fs.remove(sourceDir);
      throw error;
    }
  });
};