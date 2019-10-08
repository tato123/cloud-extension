export const getConfig = () => {};

export const cloudPipeline = (...fns) => {
  const invokablePipeline = async (...fnParams) => {
    let lastParam = fnParams;
    for (let fn of fns) {
      if (fn.type === "cloudFunction") {
        const retVal = await fn(...lastParam);

        // coerce return value back to an array to simulate
        // rest params
        lastParam = [retVal];
      } else {
        console.error("not sure what to do, skipping");
      }
    }

    return lastParam;
  };

  invokablePipeline.type = "cloudPipeline";

  return invokablePipeline;
};

const _getFunctionRef = async fnName => {
  return async fnParams => {
    const resp = await fetch(
      "https://u4269utsdf.execute-api.us-east-1.amazonaws.com/dev/functor",
      {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
          run: checksum,
          params: fnParams
        })
      }
    );

    const retVal = await resp.json();
    return retVal.data;
  };
};

export const cloudFunction = functionName => {
  const MainExecutable = async (...fnParams) => {
    // do a couple things
    // first get our function ref
    const callableRef = await _getFunctionRef(functionName);

    return callableRef(fnParams);
  };

  MainExecutable.type = "cloudFunction";

  return MainExecutable;
};

export default class Cloud {
  constructor(options) {
    this.options = options;
  }

  static initialize(options) {
    return new Cloud(options);
  }
}
