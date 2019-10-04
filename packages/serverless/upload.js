"use strict";

const AWS = require("aws-sdk");
const AdmZip = require("adm-zip");
const { from } = require("rxjs");

const s3 = new AWS.S3();

module.exports.handler = async (event, context, callback) => {
  var srcBucket = event.Records[0].s3.bucket.name;
  var srcKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );

  const params = { Bucket: srcBucket, Key: srcKey };
  console.log("Looking up file ", params);
  // do some unzipping

  try {
    // try to make public first
    await s3
      .putObjectAcl({
        Bucket: srcBucket,
        Key: srcKey,
        ACL: "public-read-write"
      })
      .promise();

    const data = await s3.getObject(params).promise();

    console.log("Got s3 object", data);
    let zip = new AdmZip(data.Body);
    let zipEntries = zip.getEntries();

    let source = from(zipEntries);
    let results = [];

    source.subscribe(
      zipEntry => {
        console.log("Reading a zip entry");
        let params = {
          Bucket: srcBucket,
          Key: zipEntry.name,
          Body: zipEntry.getCompressedData() // decompressed file as buffer
        };
        console.log("Entry", zipEntry.toString()); // outputs zip entries information
      },
      err => {
        callback(err, null);
      },
      () => {
        console.log("Completed and trying to delete");
        let params = { Bucket: srcBucket, Key: srcKey };
        // Delete zip file
        // s3.deleteObject(params, (err, data) => {
        //   if (err) {
        //     callback(err, null);
        //   } else {
        //     callback(null, data);
        //   }
        // });
      }
    );
  } catch (err) {
    console.log("An error occured:", err);
    return callback(err, null);
  }
};
