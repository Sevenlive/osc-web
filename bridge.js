var osc = require('node-osc'),
  io = require('socket.io').listen(8081),
  si = require('systeminformation'),
  pretty = require('prettysize');

var oscServer, oscClient;

var Systeminfo, NetworkInterface;
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
    si.networkInterfaceDefault(function(data) {
      NetworkInterface = data;
    })
    si.networkStats(NetworkInterface)
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
      msg.splice(0, 2);
      //console.log(msg);
      var Ausgabe = [];
      msg.forEach(element => {
        if(element[0].includes("framerate"))
        {
          Ausgabe.push(element);
        }
        else if(element[0].includes("mixer/audio/volume"))
        {
          element[1] = 20 * (Math.log10(element[1]/ 2147483647));
          element[2] = 20 * (Math.log10(element[2]/ 2147483647));
          Ausgabe.push(element);
        }
        
      });
      socket.emit('message', Ausgabe);
    });
  });
  socket.on("disconnect", function () {
    oscServer.close();
  })
});