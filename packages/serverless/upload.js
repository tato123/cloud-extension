"use strict";

const AWS = require("aws-sdk");
const AdmZip = require("adm-zip");
const _ = require("lodash");
const yaml = require("js-yaml");

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();

const lambdaIamRole = process.env.iamRole;
const extensionTable = process.env.tableName;
const runtime = process.env.runtime;

const getEventData = event => {
  const srcBucket = event.Records[0].s3.bucket.name;
  const srcKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  const tags = srcKey.match(/(.*)\.zip/);
  if (tags.length !== 2) {
    console.error("Unable to parse, unexpected tag", tags);
    return callback("Invalid zip file");
  }
  const name = tags[1];
  const destBucket = "extension-live";

  return {
    srcBucket,
    srcKey,
    name,
    destBucket
  };
};

const readZipEntries = (data, destBucket, name) => {
  //
  let zip = new AdmZip(data.Body);
  let zipEntries = zip.getEntries();

  let results = zipEntries.map(zipEntry => {
    const data = zipEntry.getData().toString("utf8");
    const zipParams = {
      name: zipEntry.name,
      data: data,
      s3: {
        Bucket: destBucket,
        ACL: "public-read-write",
        Key: `${name}/` + zipEntry.name,
        Body: Buffer.from(data, "binary")
      }
    };
    return zipParams;
  });

  return results;
};

const writeExtensionRecord = async entry => {
  if (entry == null) {
    console.error("No Extension record");
    return;
  }

  console.log("writing extension record", entry);
  const data = entry.data;
  const doc = yaml.safeLoad(data);

  var params = {
    Item: {
      ExtensionId: {
        S: entry.name
      },
      Name: {
        S: doc.name
      }
    },
    ReturnConsumedCapacity: "TOTAL",
    TableName: extensionTable
  };

  await dynamodb.putItem(params).promise();

  return doc;
};

const filterByName = (entries, name) => {
  console.log("Filtering entries", entries, name);
  const index = _.findIndex(entries, { name: name });
  return entries[index];
};

const uploadEntries = entries => {
  return Promise.all(
    entries.map(async entry => {
      console.log("Writing zip entry", entry);
      // upload decompressed file
      const zipData = await s3.putObject(entry.s3).promise();
      console.log("upload complete", zipData);
      return zipData;
    })
  );
};

const writeLambdaFunction = async (bucket, key, doc) => {
  const fnName = "functor-" + doc.name.replace(" ", "_").toLowerCase();
  const handler = "index.handler";

  const params = {
    Code: {
      S3Bucket: bucket,
      S3Key: key
    },
    Description: "",
    FunctionName: fnName,
    Handler: handler, // is of the form of the name of your source file and then name of your function handler
    MemorySize: 128,
    Publish: true,
    Role: lambdaIamRole, // replace with the actual arn of the execution role you created
    Runtime: runtime,
    Timeout: 120,
    VpcConfig: {}
  };

  console.log("[Lambda upload] Dry Run", params);
  await lambda.createFunction(params).promise();

  return null;
};

module.exports.handler = async (event, context, callback) => {
  const { srcBucket, srcKey, name, destBucket } = getEventData(event);
  const params = { Bucket: srcBucket, Key: srcKey };
  console.log("Looking up file ", params);

  try {
    // Get Zip
    const data = await s3.getObject(params).promise();
    console.log("Got s3 object", data);

    // Read Entries
    const entries = await readZipEntries(data, destBucket, name);

    // write extension record
    const extension = await writeExtensionRecord(
      filterByName(entries, "extension.yml")
    );

    // write function
    await writeLambdaFunction(srcBucket, srcKey, extension);

    // write options
    await uploadEntries(entries);

    // Delete zip file
    console.log("Cleaning up zip");
    // const deleteData = await s3.deleteObject(params).promise();
    // callback(null, deleteData);
    callback(null, "ok");
  } catch (err) {
    console.log("An error occured:", err);
    return callback(err, null);
  }
};
