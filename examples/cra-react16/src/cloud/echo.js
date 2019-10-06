import Cloud from "@diff/client-api";

const piper = Cloud.initialize({
  apiKey: "123"
});

export const echo = () => {
  return piper.cloudFunction("echo-smart")("hello world");
};

export const pipeline = async () => {
  return piper.cloudPipeline(
    piper.cloudFunction("echo-smart"),
    piper.cloudFunction("fancy-log")
  )("hello-world");
};

export const listFunctions = () => piper.cloudFunction("list-fns");
