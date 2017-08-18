var express = require('express');
var router = express.Router();
var func = require("./../custom_libs/func.js");
var firebase = require('firebase');

var admin = require("firebase-admin");
var db = admin.database();
var userRef = db.ref("users");

var webName = "ADMIN";

router.get('/', function (req, res, next) {
    userRef.orderByChild("type").equalTo("client").limitToLast(15).once("value", function (snap) {
        var data = snap.val();
        var dataRe = {};
        if(data !== null){
            var keys = Object.keys(data).reverse();
            keys.forEach(function (val, i) {
                dataRe[val] = data[val];
                dataRe[val]['time'] = func.set_date_ser(new Date(func.decode_key(val)));
            });
            //res.json({dataRe :dataRe});
        }
        res.render('pages/users', {page: "users", data: dataRe });
    });
});

router.get('/profile/:id',function(req, res, next){
    var id = req.params.id;
    userRef.child(id).once('value',function(snap){
        var data = snap.val();
        if(data !== null){
            data['uid'] = snap.key;
            return res.render('pages/driver_profile', {
                page: "users",
                data: data,
                user_type: "user"
            });
        }else{
            return res.redirect('pages/users');
        }
    });

});

module.exports = router;