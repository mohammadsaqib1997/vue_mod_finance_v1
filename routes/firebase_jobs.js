var admin_firebase = require("firebase-admin");
var db = admin_firebase.database();
var regSubsRef = db.ref('reg_subsidiary');
var subsRef = db.ref('subsidiary');

var elasticSearch = require('elasticsearch');
var client = elasticSearch.Client({
    host: 'localhost:9200'
});


regSubsRef.on("child_added", function (snap) {
    createOrUpdateIndex(snap, 'reg_subs', 'id');
});
regSubsRef.on("child_changed", function (snap) {
    createOrUpdateIndex(snap, 'reg_subs', 'id');
});
regSubsRef.on("child_removed", function (snap) {
    removeIndex(snap, 'reg_subs', 'id');
});

subsRef.on("child_added", function (snap) {
    createOrUpdateIndex(snap, 'subs', 'id');
});
subsRef.on("child_changed", function (snap) {
    createOrUpdateIndex(snap, 'subs', 'id');
});
subsRef.on("child_removed", function (snap) {
    removeIndex(snap, 'subs', 'id');
});


function createOrUpdateIndex(snap, ref, type) {
    client.index({
        index: ref,
        type: type,
        id: snap.key,
        body: snap.val()
    }, function (err, res) {
        if(err){
            console.log(err);
        }
    });
}

function removeIndex(snap, ref, type) {
    client.delete({
        index: ref,
        type: type,
        id: snap.key
    }, function (error, response) {
        if(error){
            console.log(error);
        }
    });
}