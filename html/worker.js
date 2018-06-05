importScripts("./socket.io.js");
console.log("starting updating probes disco...");

let socket = io("https://atlas-stream.ripe.net:443", {
    path: "/stream/socket.io",
    transports: ["websocket"],
    upgrade: false
});

socket.emit("atlas_subscribe", { stream_type: "probestatus" });

socket.on("atlas_probestatus", r => {
    self.postMessage(JSON.stringify(r, null));
});
