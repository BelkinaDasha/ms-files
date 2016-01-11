const Promise = require('bluebird');
const IMAGE_SIZE = { start: 0, end: 3 };
const HASH_SIZE = 16;

module.exports = function extractMetadata(provider, { key, data, redis }) {
  const { filename } = data;

  return Promise.join(
    provider.readFile(filename, IMAGE_SIZE),
    provider.readFile(filename, { start: data.contentLength - HASH_SIZE })
  )
  .spread(function addMetadata(image, md5) {
    const imageLength = image.contents.readInt32BE(0);
    const md5Hash = md5.contents.toString('hex');
    const lengthHeader = image.response.headers['x-goog-stored-content-length'];
    const contentLength = parseInt(lengthHeader, 10) - 20 - imageLength;
    const output = {
      previewSize: imageLength,
      modelSize: contentLength,
      checksum: md5Hash,
    };

    return redis.hmset(key, output).return(output);
  });
};