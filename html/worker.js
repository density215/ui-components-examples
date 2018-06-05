// There is a worker-loader for webpack
// Unfortunately that looses the global scope of the worker
// when using importScripts apparantly and then
// drops down to the scope of the window object
// which has a postMessage function and will give the error:
// "Uncaught TypeError: Failed to execute 'postMessage' on 'Window': 2 arguments required, but only 1 present."
// see: https://github.com/webpack-contrib/worker-loader/issues/145
// and https://github.com/webpack-contrib/worker-loader/issues/139
//
// The 
// 
// So were using the old school way, where we copy over this script to the root
// so the Worker() constructor can use it directly.

importScripts("./socket.io.js");
console.log("starting probes disco...");

let socket = io("https://atlas-stream.ripe.net:443", {
    path: "/stream/socket.io",
    transports: ["websocket"],
    upgrade: false
});

socket.emit("atlas_subscribe", { stream_type: "probestatus" });

socket.on("atlas_probestatus", r => {
    self.postMessage(JSON.stringify(r, null));
});
