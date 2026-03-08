import { boot } from "https://v2-17-1--edge.netlify.com/bootstrap/index-combined.ts";

const functions = {}; const metadata = { functions: {} };


      try {
        const { default: func } = await import("file:///C:/Users/kunle/Documents/web/kunle/public/video%20tutorials/netlify/edge-functions/hello.js");

        if (typeof func === "function") {
          functions["hello"] = func;
          metadata.functions["hello"] = {"url":"file:///C:/Users/kunle/Documents/web/kunle/public/video%20tutorials/netlify/edge-functions/hello.js"}
        } else {
          console.log("\u001b[91m⬥\u001b[39m \u001b[31mFailed\u001b[39m to load Edge Function \u001b[33mhello\u001b[39m. The file does not seem to have a function as the default export.");
        }
      } catch (error) {
        console.log("\u001b[91m⬥\u001b[39m \u001b[31mFailed\u001b[39m to run Edge Function \u001b[33mhello\u001b[39m:");
        console.error(error);
      }
      

boot(() => Promise.resolve(functions));