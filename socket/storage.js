const admin = require('firebase-admin');
const serviceAccount = require('./cache-cache-connecte-0d1a05d60761.json');

var server = require("./server")


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


module.exports.registerPlayer = async function (address, name) {

  const docRef = db.collection('players').doc(address);

  const sensor = {
    address: address,
    date: Date.now(),
    name: name
  }

  await docRef.get().then((snapshotDoc)=> {
    if (!snapshotDoc.exists)
      docRef.set(sensor);
    else
      docRef.update(sensor);
  })
}

module.exports.updateButton = async function (address, date) {

  const docRef = db.collection('players').doc(address);

  const sensor = {
    lastPressed: date,
  }

  await docRef.get().then((snapshotDoc)=> {
    if (!snapshotDoc.exists)
      docRef.set(sensor);
    else
      docRef.update(sensor);
  })
}

module.exports.updateStatePlayer = async function (address, alive) {

  const docRef = db.collection('players').doc(address);

  const sensor = {
    isAlive: alive,
  }

  await docRef.get().then((snapshotDoc)=> {
    if (!snapshotDoc.exists)
      docRef.set(sensor);
    else
      docRef.update(sensor);
  })
}

module.exports.endGame = async function (address, date, playerEliminated, callback) {

  var numPlayerEliminated = 0;
  var isHuntingValue = true;

  if (playerEliminated == true) {
    numPlayerEliminated++;
    console.log("numEliminated = " + numPlayerEliminated)
  }

  if (numPlayerEliminated == 1) {
    isHuntingValue = false;
    console.log("isHuntingValue = " + isHuntingValue)
    callback("john")
  }

  const docRef = db.collection('hunter').doc(address);

  const sensor = {
    isHunting: isHuntingValue,
    dateEndGame: date,
  }

  await docRef.get().then((snapshotDoc)=> {
    if (!snapshotDoc.exists)
      docRef.set(sensor);
    else
      docRef.update(sensor);
  })
}

module.exports.registerHunter = async function (address, date, hunting) {

  const docRef = db.collection('hunter').doc(address);

  const sensor = {
    dateStartGame: date,
    isHunting: hunting,
  }

  await docRef.get().then((snapshotDoc)=> {
    if (!snapshotDoc.exists)
      docRef.set(sensor);
    else
      docRef.update(sensor);
  })
}


module.exports.retrievePlayer = function (address) {

  const docRef = db.collection('players');

  return docRef.get(address);

}

module.exports.retrieveLastPressed = function (address) {

  const docRef = db.collection('players').doc(address);

  return docRef.get();
}

