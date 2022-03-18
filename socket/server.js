var SerialPort = require('serialport');
var xbee_api = require('xbee-api');
var C = xbee_api.constants;
var storage = require("./storage")
require('dotenv').config()


const SERIAL_PORT = process.env.SERIAL_PORT;

var xbeeAPI = new xbee_api.XBeeAPI({
  api_mode: 2
});

let serialport = new SerialPort(SERIAL_PORT, {
  baudRate: parseInt(process.env.SERIAL_BAUDRATE) || 9600,
}, function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
});

serialport.pipe(xbeeAPI.parser);
xbeeAPI.builder.pipe(serialport);

serialport.on("open", function () {

  var frame_obj;

  // sleepmode OFF -> not working
  frame_obj = {
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination64: "FFFFFFFFFFFFFFFF",
    command: "D8",
    commandParameter: [4],
  };
  xbeeAPI.builder.write(frame_obj);
  
  // activer le bouton de tous les routeurs
  frame_obj = {
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination16: "FFFFFFFFFFFFFFFF",
    command: "D2",
    commandParameter: [03],
  };
  xbeeAPI.builder.write(frame_obj);

  // activer le bouton pour lancer la partie
  frame_obj = {
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination16: "FFFFFFFFFFFFFFFF",
    command: "D3",
    commandParameter: [03],
  };
  xbeeAPI.builder.write(frame_obj);

  frame_obj = {
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination16: "FFFFFFFFFFFFFFFF",
    command: "IC",
    commandParameter: [C], // C = DIO2 + DIO3
  };
  xbeeAPI.builder.write(frame_obj);

  // éteint la lumière de tous les routeurs/proies
  frame_obj = {
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination64: "FFFFFFFFFFFFFFFF",
    command: "D0",
    commandParameter: [00],
  };
  xbeeAPI.builder.write(frame_obj);

  // éteint la lumière du coordinateur
  lightCoordinatorOff();

});

lightCoordinatorOn = function () {

  frame_obj = {
    type: C.FRAME_TYPE.AT_COMMAND,
    command: "D1",
    commandParameter: [05],
  };
  xbeeAPI.builder.write(frame_obj);

}

lightCoordinatorOff =  function () {
  frame_obj = {
    type: C.FRAME_TYPE.AT_COMMAND,
    command: "D1",
    commandParameter: [04],
  };
  xbeeAPI.builder.write(frame_obj);
}

lightOff = function (address) {

  frame_obj = {
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination16: address,
    command: "D0",
    commandParameter: [00],
  };
  xbeeAPI.builder.write(frame_obj);

}

lightOn = function (address) {

  frame_obj = {
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination16: address,
    command: "D0",
    commandParameter: [05],
  };
  xbeeAPI.builder.write(frame_obj);

}

// fonction pour active le sleepmode --> not working
sleepmodeP1 = function () {

  frame_obj = {
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination16: "b7d1",
    command: "SM",
    commandParameter: [5],
  };
  xbeeAPI.builder.write(frame_obj);
}

// fonction pour capter le signal et avoir infos de proximité --> not working
dbCall = function () {
  frame_obj = {
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination16: "FFFFFFFFFFFFFFFF",
    command: "DB",
    commandParameter: [],
  };
  xbeeAPI.builder.write(frame_obj);
}, 600;

// All frames parsed by the XBee will be emitted here

xbeeAPI.parser.on("data", function (frame) {

  //on new device is joined, register it

  //on packet received, dispatch event
  if (C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET === frame.type) {
    console.log("C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET");
    let dataReceived = String.fromCharCode.apply(null, frame.data);
    console.log(">> ZIGBEE_RECEIVE_PACKET >", dataReceived);

  }

  if (C.FRAME_TYPE.NODE_IDENTIFICATION === frame.type) {
    console.log("NODE_IDENTIFICATION");
    console.log(frame.nodeIdentifier);
    storage.registerPlayer(frame.remote64, frame.nodeIdentifier);

  } else if (C.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX === frame.type) {

    console.log("ZIGBEE_IO_DATA_SAMPLE_RX");
    console.log(frame);

    if (frame.digitalSamples.DIO2 === 1) {
      //déclarer le sleepmode -> not working
      //sleepmodeP1();
      console.log("lumière éteinte")
      lightOff(frame.remote16);
      storage.updateButton(frame.remote64, Date.now());
      storage.updateStatePlayer(frame.remote64, false);

      storage.endGame("0013A20041C34AC1", Date.now(), true, (name)=>{
        console.log("partie terminée");
        lightCoordinatorOff();
      });
    } else {
      let lastPressedOld;
      storage.retrieveLastPressed(frame.remote64).then((player) => {
        lastPressedOld = player.data().lastPressed;

        diff = Date.now() - lastPressedOld;
        if (diff < 5000 && diff > 2000) {
          console.log("entre 2 et 5 sec")
          console.log("routeur allumé : " + frame.nodeIdentifier)
          lightOn(frame.nodeIdentifier);
          storage.updateStatePlayer(frame.remote64, true);
        } else if (diff < 2000){
          console.log("just clicked")
        } else {
          console.log("click error/lumière éteinte")
        }
        console.log(lastPressedOld,diff);
      });
    }

    if (frame.digitalSamples.DIO3 === 1) {
      console.log("lumière coordinateur allumée/partie lancée")
      lightCoordinatorOn();
      storage.updateButton(frame.remote64, Date.now());

      //lance la partie
      storage.registerHunter("0013A20041C34AC1", Date.now(), true)
    }

  } else if (C.FRAME_TYPE.ZIGBEE_EXPLICIT_RX === frame.type) {
    console.log(frame)
    // activer bouton pour lancer partie sur le coordinateur --> not working
    /*if (frame.digitalSamples.DIO3 === 1) {
      //lance la partie
      console.log("partie lancée")
      storage.registerHunter(frame.remote64, Date.now());
      lightCoordinatorOn();
    }*/
  } else if (C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE === frame.type) {
    console.log("REMOTE_COMMAND_RESPONSE")
    /*let buf = frame.commandData;
    var int = buf.readUIntBE(0, Buffer.byteLength(buf));*/
  } else {
    console.debug(frame);
    let dataReceived = String.fromCharCode.apply(null, frame.commandData)
    console.log(dataReceived);
  }

});