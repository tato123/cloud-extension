"use strict";

const AWS = require("aws-sdk");
const AdmZip = require("adm-zip");
const _ = require("lodash");
const yaml = require("js-yaml");
const { toFnName } = require("./utils/fnName");

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

const writeExtensionRecord = async (entry, uid) => {
  if (entry == null) {
    console.error("No Extension record");
    return;
  }

  console.log("Saving extension file to s3");
  // write upload file
  await uploadEntries([entry]);

  console.log("writing extension record", entry);
  const data = entry.data;
  const doc = yaml.safeLoad(data);

  const params = {
    Item: {
      ExtensionId: {
        S: uid
      },
      Name: {
        S: doc.name
      },
      Version: {
        S: doc.version
      },
      Description: {
        S: doc.description || ""
      },
      DisplayName: {
        S: doc.displayName
      }
    },
    ReturnConsumedCapacity: "TOTAL",
    TableName: extensionTable
  };

  await dynamodb.putItem(params).promise();

  return doc;
};

const filterByName = (entries, name) => {
  console.log("---Filtering entries", entries.length);
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

const doesLambdaExist = async fnName => {
  try {
    const params = {
      FunctionName: fnName
    };

    const data = await lambda.getFunction(params).promise();
    console.log("Lambda Record found", data);
    return true;
  } catch (err) {
    console.log("Lambda does not exist");
    return false;
  }
};

const writeLambdaFunction = async (bucket, key, doc) => {
  const fnName = "functor-" + doc.name.replace(" ", "_").toLowerCase();
  const fnExists = await doesLambdaExist(fnName);
  const handler = "index.handler";

  if (fnExists) {
    const update = {
      FunctionName: fnName,
      Publish: true,
      S3Bucket: bucket,
      S3Key: key
    };
    console.log("Updating lambda", fnName, "with params", update);

    await lambda.updateFunctionCode(update).promise();
  } else {
    const writeParams = {
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
    console.log("Creating lambda with params", writeParams);
    await lambda.createFunction(writeParams).promise();
  }

  return null;
};

const copyZip = async (srcBucket, srcKey, destBucket, folder) => {
  const destKey = `${folder}/${srcKey}`;

  const params = {
    Bucket: destBucket,
    CopySource: `/${srcBucket}/${srcKey}`,
    Key: destKey
  };
  console.log("---[copying zip]", params);

  await s3.copyObject(params).promise();

  return {
    bucket: destBucket,
    key: destKey
  };
};

module.exports.handler = async (event, context, callback) => {
  const { srcBucket, srcKey, name, destBucket } = getEventData(event);
  const params = { Bucket: srcBucket, Key: srcKey };
  console.log("Looking up file ", params);

  try {
    // Get Zip
    const data = await s3.getObject(params).promise();
    console.log("Got s3 object", data);

    // stage-zip
    const copiedTo = await copyZip(srcBucket, srcKey, destBucket, name);

    // Read Entries
    const entries = await readZipEntries(data, destBucket, name);

    // write extension record
    const extensionFile = filterByName(entries, "extension.yml");
    const extension = await writeExtensionRecord(extensionFile, name);

    // write function
    await writeLambdaFunction(copiedTo.bucket, copiedTo.key, extension);

    // Delete zip file
    console.log("Cleaning up zip");
    const deleteData = await s3.deleteObject(params).promise();
    callback(null, deleteData);
  } catch (err) {
    console.log("An error occured:", err);
    return callback(err, null);
  }
};
