var admin_firebase = require("firebase-admin");
var db = admin_firebase.database();
var regSubsRef = db.ref('reg_subsidiary');

var ElasticClient = require('elasticsearchclient');
var client = new ElasticClient({ host: 'localhost', port: 9200 });


regSubsRef.on("child_added", function (snap) {
    createOrUpdateIndex(snap, 'reg_subs', 'id');
});
regSubsRef.on("child_changed", function (snap) {
    createOrUpdateIndex(snap, 'reg_subs', 'id');
});
regSubsRef.on("child_removed", function (snap) {
    removeIndex(snap, 'reg_subs', 'id');
});




function createOrUpdateIndex(snap, ref, type) {
    client.index(ref, type, snap.val(), snap.key)
        .on('data', function(data) { console.log('Added Key', snap.key); })
        .on('error', function(err) { console.log(err) })
        .exec();
}

function removeIndex(snap, ref, type) {
    client.deleteDocument(ref, type, snap.key, function(error, data) {
        if( error ) console.error('failed to delete', snap.key, error);
        else console.log('deleted', snap.key);
    });
}