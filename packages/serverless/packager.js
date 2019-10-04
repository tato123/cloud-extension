"use strict";

const AWS = require("aws-sdk");
const Busboy = require("busboy");

const s3 = new AWS.S3();

const getContentType = event => {
  let contentType = event.headers["content-type"];
  if (!contentType) {
    return event.headers["Content-Type"];
  }
  return contentType;
};

const parser = event =>
  new Promise((resolve, reject) => {
    const busboy = new Busboy({
      headers: event.headers
    });

    const result = {};

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      const fileRead = [];

      file.on("data", chunk => {
        fileRead.push(chunk);
      });

      file.on("end", () => {
        result.file = Buffer.concat(fileRead);
        result.filename = filename;
        result.contentType = mimetype;
      });
    });

    busboy.on("field", (fieldname, value) => {
      result[fieldname] = value;
    });

    busboy.on("error", error => reject(`Parse error: ${error}`));
    busboy.on("finish", () => resolve(result));

    busboy.write(event.body, event.isBase64Encoded ? "base64" : "binary");
    busboy.end();
  });

module.exports.handle = async (event, context, callback) => {
  console.log("Event is", event);

  try {
    const results = await parser(event);
    console.log("results are", results);

    const data = await s3
      .putObject({
        Key: results.key,
        ACL: "public-read",
        Bucket: "extension-staging",
        Body: results.file
      })
      .promise();
    console.log("wrote file", data);
    callback(null, { result: "Success", files: results });
  } catch (err) {
    callback(err);
  }
};
