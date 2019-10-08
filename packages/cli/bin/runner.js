import program from "commander";
import chalk from "chalk";
import pkg from "../package.json";
import fs from "fs";
import path from "path";
import { upload, validateExtension, createZip } from "../lib/deploy";
import AWS from "aws-sdk";

const uuidv4 = require("uuid/v4");

program
  .command("publish <dir>")
  .description("Makes all your cloud stuff")
  .action(dir => {
    const workingDir = path.resolve(process.cwd(), dir);
    const extensionYaml = path.resolve(workingDir, "./extension.yml");
    const filename = uuidv4() + ".zip";

    createZip(workingDir)
      .then(zip => upload(filename, zip))
      .then(result => {
        console.log("Successfully uploaded with result", result);
      })
      .catch(e => {
        console.error("Unable to upload", e);
      });
  });

program
  .usage("<command> [options]")
  .version(pkg.version)
  .parse(process.argv);
