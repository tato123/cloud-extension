class Cloud {
  constructor(options) {
    this.options = options;
  }

  async _getFunctionRef(fnName) {
    // get back the associated invocable checksum
    const resp = await fetch(
      `http://localhost:3000/a/${this.options.apiKey}/ref/${fnName}`
    );
    const checksum = await resp.text();

    return async fnParams => {
      const resp = await fetch("http://localhost:3000/runner", {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
          run: checksum,
          params: fnParams
        })
      });

      const retVal = await resp.json();
      return retVal.data;
    };
  }

  /**
   * Returns an invocable Reference
   */
  cloudFunction(functionName) {
    const MainExecutable = async (...fnParams) => {
      // do a couple things
      // first get our function ref
      const callableRef = await this._getFunctionRef(functionName);

      return callableRef(fnParams);
    };

    MainExecutable.type = "cloudFunction";

    return MainExecutable;
  }

  /**
   * Configures a pipeline of operations that we will queue together
   */
  cloudPipeline(...fns) {
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
  }

  static initialize(options) {
    return new Cloud(options);
  }
}

export default Cloud;
