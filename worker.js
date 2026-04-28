importScripts("ai.js");
let resolveReady;
const wasmReady = new Promise(r => resolveReady = r);
let aiSearch;
Module.onRuntimeInitialized = () => {
  aiSearch = Module.cwrap('ai_search', null, ['number','number','number','number']);
  resolveReady();
};


onmessage = async (e) => {
   if (e.data.type === "ai") {
      await wasmReady; // ← これで絶対安全

      const out = Module._malloc(6 * 4);

      aiSearch(e.data.low, e.data.high, 15000, out);

      const mv = {
         r0: Module.HEAP32[out >> 2],
         c0: Module.HEAP32[(out >> 2) + 1],
         r1: Module.HEAP32[(out >> 2) + 2],
         c1: Module.HEAP32[(out >> 2) + 3],
         r2: Module.HEAP32[(out >> 2) + 4],
         c2: Module.HEAP32[(out >> 2) + 5],
      };

      Module._free(out);
      postMessage({ mv });
   }
};
