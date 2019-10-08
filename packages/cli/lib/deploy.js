import AdmZip from "adm-zip";
import fs from "fs";
import yaml from "js-yaml";
import request from "request";
import S3 from "aws-sdk/clients/s3";

const s3 = new S3({
  accessKeyId: "AKIASVQKCRODDWYW5L2M",
  secretAccessKey: "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"
});

export const upload = (filename, zip) => {
  // const formData = {
  //   key: filename,
  //   file: zip.toBuffer(),
  //   acl: "public-read-write",
  //   AWSAccessKeyId: "AKIASVQKCRODNF3CDKOQ"
  // };

  // console.log("Writing with form data", formData);

  var params = {
    ACL: "public-read-write",
    Body: zip.toBuffer(),
    Bucket: "extension-staging",
    Key: filename
  };
  return s3.putObject(params).promise();
};

export const validateExtension = extensionYaml => {
  // read the extension yml
  var doc = yaml.safeLoad(fs.readFileSync(extensionYaml, "utf8"));

  // perform validation
  console.log("Valid Extension");
  return true;
};

export const createZip = async workingDir => {
  // package it up
  const zip = new AdmZip();
  const items = fs.readdirSync(workingDir);

  for (let i in items) {
    const stat = fs.statSync(items[i]);
    console.log("Reading item", items[i]);

    if (stat.isFile()) {
      zip.addLocalFile(items[i]);
    } else if (stat.isDirectory()) {
      zip.addLocalFolder(items[i], items[i]);
    }
  }

  return zip;
};
