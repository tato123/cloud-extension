import program from "commander";
import chalk from "chalk";
import pkg from "../package.json";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
const AdmZip = require("adm-zip");

const request = require("request");
const uuidv4 = require("uuid/v4");

program
  .command("publish <dir>")
  .description("Makes all your cloud stuff")
  .action(dir => {
    const workingDir = path.resolve(process.cwd(), dir);
    const extensionYaml = path.resolve(workingDir, "./extension.yml");
    const filename = uuidv4() + ".zip";
    const tmpZip = path.resolve(workingDir, filename);

    try {
      // read the extension yml
      var doc = yaml.safeLoad(fs.readFileSync(extensionYaml, "utf8"));

      // perform validation
      console.log("Valid Extension");

      // package it up
      const zip = new AdmZip();
      const items = fs.readdirSync(workingDir);

      for (let i in items) {
        console.log("Reading item", items[i]);
        zip.addLocalFile(items[i]);
      }

      try {
        const formData = {
          key: filename,
          file: zip.toBuffer(),
          acl: "public-read-write",
          "x-amz-acl": "public-read-write"
        };

        console.log("Writing with form data", formData);

        request.post(
          "https://ijce6h9e6g.execute-api.us-east-1.amazonaws.com/dev/package/upload",
          {
            formData: formData
          },
          (err, httpResponse, body) => {
            if (err) {
              return console.error(err);
            }
            console.log("Sent");
          }
        );
      } catch (err) {
        console.error(err);
      }

      // write an entry with a checksum
    } catch (e) {
      console.log(e);
    }
  });

program
  .usage("<command> [options]")
  .version(pkg.version)
  .parse(process.argv);
