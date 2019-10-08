"use strict";

const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB();

exports.handler = async event => {
  const params = {
    TableName: "ExtensionTable"
  };
  const results = await dynamodb.scan(params).promise();
  return results.Items.map(x => x.Name.S);
};
