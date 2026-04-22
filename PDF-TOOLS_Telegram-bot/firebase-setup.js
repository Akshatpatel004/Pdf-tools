const admin = require('firebase-admin');

try {
    if (!process.env.FIREBASE_KEY) {
        throw new Error ("Firebase key is missing from environment variable");
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\ \n/g, '\n');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log("Firebase admin initialized successfully"); 

} catch (error) {
    console.log("Firebase admin initialized error", error); 
    return null;
}

const firestoreDB = admin.firestore();

module.exports = firestoreDB;
