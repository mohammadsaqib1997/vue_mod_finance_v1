var express = require('express');
var router = express.Router();
var cors = require('cors');
var bcrypt = require("bcrypt-nodejs");
var saltRounds = 10;

var admin_firebase = require("firebase-admin");
var db = admin_firebase.database();
var usersRef = db.ref('users');

router.post('/check_user', cors(), function (req, res, next) {
    req.assert('email', 'Email is required!').notEmpty();
    req.assert('password', 'Password is required!').notEmpty();
    req.getValidationResult().then(function(result) {
        var errors = result.useFirstErrorOnly().array();
        if (errors.length > 0) {
            return res.json({status: "failed", message: errors[0].msg});
        }else{
            usersRef.orderByChild('email').equalTo(req.body.email).once('value').then(function (userSnap) {
                let userData = userSnap.val();
                if(userData !== null){
                    if(bcrypt.compareSync(req.body.password, userData.password)){
                        return res.json({status: "ok"});
                    }else{
                        return res.json({status: "failed", message: "Invalid credentials!"});
                    }
                }else{
                    return res.json({status: "failed", message: "Invalid email!"});
                }
            });
        }
    });
});

module.exports = router;