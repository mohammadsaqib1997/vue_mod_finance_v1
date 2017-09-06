var express = require('express');
var router = express.Router();
var cors = require('cors');
var bcrypt = require("bcrypt-nodejs");
var saltRounds = 10;

var admin_firebase = require("firebase-admin");
var db = admin_firebase.database();
var usersRef = db.ref('users');
var regSubsRef = db.ref('reg_subsidiary');

var elasticSearch = require('elasticsearch');
var client = elasticSearch.Client({
    host: 'localhost:9200'
});

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
                    let keys = Object.keys(userData);
                    let sel_user = userData[keys[0]];
                    if(bcrypt.compareSync(req.body.password, sel_user.password)){
                        if(sel_user.act_status){
                            admin_firebase.auth().createCustomToken(keys[0]).then(function (token) {
                                return res.json({"status": "ok", "token": token});
                            }).catch(function (err) {
                                return res.json({"status": "failed", "message": "Error creating custom token: " + err});
                            });
                        }else{
                            return res.json({status: "failed", message: "Deactivate your account!"});
                        }
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

router.get('/get_codes', function (req, res, next) {
    let project = req.query.project;
    let input = req.query.input;
    client.search({
        index: 'reg_subs',
        type: 'id',
        body: {
            _source: input+"*",
            query: {
                match: {
                    _id: project
                }
            }
        }
    }, function (err, response) {
        if(err){
            res.json(null);
        }else{
            let hits = response.hits.hits[0];
            let source = hits._source;
            let codes = Object.keys(source);
            let process_item = 0;

            if(codes.length > 0){
                codes.forEach(function (code) {
                    let row = source[code];
                    client.search({
                        index: 'subs',
                        type: 'id',
                        body: {
                            query: {
                                match: {
                                    _id: row.key
                                }
                            }
                        }
                    }, function (err, response2) {
                        response.hits.hits[0]._source[code].sub_name = response2.hits.hits[0]._source.name;
                        process_item++;
                        if(process_item === codes.length){
                            res.json(response);
                        }
                    });

                });
            }else{
                res.json(null);
            }
        }
    });
});

module.exports = router;