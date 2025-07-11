const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seed() {
    // 1. Create admin user profile
    const adminUid = "20BKnomOa1et0S4mObx4ynZM3El1"; // Replace with your Firebase Auth admin UID
    await db.collection("profiles").doc(adminUid).set({
        name: "Akash",
        email: "akashsingh8187@gmail.com",
        phone: "8181066459",
        city: "Kanpur",
        role: "admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });



    console.log("Admin user created and collections initialized!");
}

seed().catch(console.error);