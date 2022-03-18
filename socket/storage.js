const admin = require('firebase-admin');
const serviceAccount = require('./cache-cache-connecte-0d1a05d60761.json');

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

/*module.exports.registerTypePlayer = async function (address, sample) {

  const docRef = db.collection('sensors').doc(address)
    .collection('samples').doc(Date.now().toString());

  const data = {
    value: sample,
    date: Date.now(),
  }
  await docRef.set(data);


}*/

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

module.exports.startGame = async function (address, date) {

  const docRef = db.collection('hunter').doc(address);

  const sensor = {
    dateStartGame: date,
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

module.exports.registerSample = async function (address, sample) {

  const docRef = db.collection('sensors').doc(address)
    .collection('samples').doc(Date.now().toString());

  const data = {
    value: sample,
    date: Date.now(),
  }
  await docRef.set(data);


}

module.exports.listSensors = function () {

  const docRef = db.collection('sensors');

  return docRef.get()

}

