import Cloud from "@diff/client-api";

const piper = Cloud.initialize({
  apiKey: "123"
});

// // Advanced funcitonality
// cloudPipeline(
//   cloudFunction(),
//   map('abc', (c => {
//       console.log('do some stuff')
//   }) ),
//   cloudFunction('stripe')()
// )

export const echo = () => {
  return piper.cloudFunction("echo-smart")("hello world");
};

export const pipeline = async () => {
  return piper.cloudPipeline(
    piper.cloudFunction("echo-smart"),
    piper.cloudFunction("fancy-log")
  )("hello-world");
};

// cloudPipeline(cloudFunction("echo-smart"), cloudStore({ a: "b" }));
