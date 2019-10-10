import Cloud, { cloudFunction, cloudPipeline } from "@diff/client-api";

Cloud.initialize({
  apiKey: "123"
});

export const echo = () => {
  return cloudFunction("echoer")("hello world");
};

export const pipeline = async () => {
  return cloudPipeline(
    cloudFunction("echoer"),
    x => {
      console.log("got a response inside echoer", x);
    },
    cloudFunction("fancy-log"),
    cloudPipeline(cloudFunction("listFns")),
    x => {
      console.log("Got a response, inside inner function", x);
      return x;
    }
  )("hello-world");
};
