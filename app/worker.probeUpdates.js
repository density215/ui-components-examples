import io from "socket.io-client";

console.log(self.postMessage);
console.log(self);
console.log(postMessage);
console.log(this);

let socket = io("https://atlas-stream.ripe.net:443", {
    path: "/stream/socket.io",
    transports: ["websocket"],
    upgrade: false
});

const pm = self.postMessage;
//self.postMessage("bla");

self.onmessage = m => {
    console.log('got here');
    console.log(m.data);
}

socket.emit("atlas_subscribe", { stream_type: "probestatus" });

socket.on("atlas_probestatus", r => {
    console.log(JSON.stringify(r, null));
    //pm(JSON.stringify(r, null));
    //r.result.map(console.log);
    //  //console.log(r.result);
    //  });
    //pm('bvla');
});
