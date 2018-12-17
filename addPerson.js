var admin = require("firebase-admin");
const _ = require('lodash');

var serviceAccount = require("./creds.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sls-secretsanta.firebaseio.com"
});

const db = admin.firestore();

const slsCode = process.argv[2];
const personId = process.argv[3];

db.collection('Codes').get().then(snapshot => {
	let codes = [];
	snapshot.forEach(doc => {
		codes = [ ...codes, doc.data() ]
	});

	db.collection('People').get().then(snapshot => {
		let personIds = [];
		snapshot.forEach(doc => {
			personIds = [ ...personIds, doc.id ]
		});
		const codesByCode = _.keyBy(codes, 'slsCode');
		const codesByPersonId = _.groupBy(codes, 'personId');
		const personsCodes = _.get(codesByPersonId, personId);
		const toCode = _.find(personsCodes, code => code.toId);

		// if already has on another code
		if (toCode) {
			console.log('a', toCode);
			db.collection('Codes').doc(slsCode).set({ ...toCode, slsCode }).then(() => process.exit());
		}

		const taken = _.reduce(
			codes, 
			(taken, code) => {
				if (!code.toId || _.indexOf(taken, code.toId) !== -1) {
					return taken;
				}

				return [ ...taken, code.toId ];
			}, 
			[]
		);

		const takers = _.reduce(
			codes, 
			(takers, code) => {
				if (!code.toId || _.indexOf(takers, code.personId) !== -1) {
					return takers;
				}

				return [ ...takers, code.personId ];
			}, 
			[]
		);

		const leftToTake = _.filter(personIds, id => taken.indexOf(id) === -1);
		const willBeTaking = _.filter(personIds, id => takers.indexOf(id) === -1);
		const canTake = _.filter(leftToTake, id => id !== personId);

		let skip = false;
		if (!toCode) {
			if (leftToTake.length === 2) {
				const mustTake = _.find(canTake, id => _.indexOf(willBeTaking, id) !== -1);
				console.log({ canTake, willBeTaking, takers, taken, mustTake })
				if (mustTake) {
					console.log('b');
					db.collection('Codes').doc(slsCode).set({ toId: mustTake, personId, slsCode }).then(() => process.exit());
					skip = true;
				}
			}
			if (!skip) {
				const toId = _.get(canTake, Math.floor(Math.random() * canTake.length));
				console.log('c');
				db.collection('Codes').doc(slsCode).set({ toId, personId, slsCode }).then(() => process.exit());

			}
		}
	});

});

