var admin_firebase = require("firebase-admin");
var serviceAccount = require("../config/_serviceAccountKey.json");
var config_fireBase = require("../config/_private.json");
admin_firebase.initializeApp({
    credential: admin_firebase.credential.cert(serviceAccount),
    databaseURL: config_fireBase.config_fb.databaseURL
});

admin_firebase.auth().updateUser("<uid>", {
    password: "admin123",
})
    .then(function(userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log("Successfully updated user", userRecord.toJSON());
    })
    .catch(function(error) {
        console.log("Error updating user:", error);
    });