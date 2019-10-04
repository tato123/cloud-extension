const { createLambdaApp } = require("lambda-local-server");
const path = require("path");

const app = createLambdaApp({
  port: 8080,
  lambdas: [
    {
      entry: path.resolve("./src/launcher"),
      contextPath: "/launcher"
    },
    {
      entry: path.resolve("./src/checksumResolver"),
      contextPath: "/a",
      urls: ["/:apiKey/ref/:id"]
    },
    {
      entry: path.resolve("./src/runner"),
      contextPath: "/runner"
    },
    {
      entry: path.resolve("./src/publish"),
      contextPath: "/publish"
    }
  ]
});

app.listen().catch(error => {
  console.error(error);
  process.exit(1);
});
