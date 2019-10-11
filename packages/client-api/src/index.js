const API =
  "https://401zrzt07e.execute-api.us-east-1.amazonaws.com/dev/functor";

export const getConfig = () => {};

const toPipelineDefinition = fns => {
  // from left to right build a pipeline
  const pipeline = {
    pipeline: fns.map(fn => {
      //
      if (fn.type === "cloudFunction") {
        // generate a state id
        const stateId = Math.floor(Math.random() * 10000);
        return {
          run: fn.fnName,
          state: stateId
        };
      } else if (fn.type === "cloudPipeline") {
        return fn.definition;
      } else if (typeof fn === "function") {
        const refId = Math.floor(Math.random() * 10000);
        fn.refId = refId;
        return {
          run: "local",
          refId: refId
        };
      }
    })
  };

  return pipeline;
};

export const cloudPipeline = (...fns) => {
  const pipelineDefinition = toPipelineDefinition(fns);

  // console.log("Executing pipeline", fns.length);
  // const invokablePipeline = async (...fnParams) => {
  //   let lastParam = fnParams;
  //   for (let fn of fns) {
  //     if (fn.type === "cloudFunction") {
  //       const retVal = await fn(...lastParam);
  //       lastParam = [retVal];
  //     } else if (fn.type === "cloudPipeline") {
  //       const retval = await fn(...lastParam);
  //       lastParam = [retval];
  //     } else if (typeof fn === "function") {
  //       const retVal = await fn(...lastParam);
  //       lastParam = [retVal];
  //     } else {
  //       console.error("not sure what to do, skipping");
  //     }
  //   }

  //   return lastParam[0];
  // };

  // invokablePipeline.type = "cloudPipeline";

  // return invokablePipeline;

  const invokablePipeline = async fnParams => {
    console.log("trying to call me", fnParams);
  };
  invokablePipeline.definition = pipelineDefinition;
  invokablePipeline.type = "cloudPipeline";

  console.log("pipeline definition", pipelineDefinition);
  return invokablePipeline;
};

const _getFunctionRef = async fnName => {
  return async fnParams => {
    const resp = await fetch(API, {
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({
        run: fnName,
        params: fnParams
      })
    });

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
  MainExecutable.fnName = functionName;
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
