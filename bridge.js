var osc = require('node-osc'),
  io = require('socket.io').listen(8081),
  si = require('systeminformation'),
  pretty = require('prettysize');

var oscServer, oscClient;

var Systeminfo;
var CPULoad, TotalMemory, UsedMemory, RXSec, TXSec;
function sendSystemHealth(socket) {
  si.currentLoad()
    .then(data => {
      CPULoad = Math.round(data.currentload) + "";
    })
    .catch(error => console.error(error));
  si.mem()
    .then(data => {
      TotalMemory = pretty(data.total);
      UsedMemory = pretty(data.used);
    })
    .catch(error => console.error(error));

    si.networkStats('Ethernet')
    .then(data => {
        RXSec = pretty(data[0].rx_sec);
        TXSec = pretty(data[0].tx_sec);
    })
    .catch(error => console.error(error));

  Systeminfo = { CPULoad, TotalMemory, UsedMemory, RXSec, TXSec };
  socket.emit('Stats', Systeminfo);
}


io.on('connection', function (socket) {
  setInterval(sendSystemHealth, 1500, socket);
  socket.on('config', function (obj) {
    console.log('config', obj);
    oscServer = new osc.Server(obj.server.port, obj.server.host);
    console.log(socket.id + " connected");

    oscServer.on('message', function (msg, rinfo) {
      socket.emit('message', msg);
      console.log(msg);
      //console.log('sent OSC message to WS', msg, rinfo);
    });
  });
  socket.on("disconnect", function () {
    oscServer.close();
  })
});