var express = require('express');
var router = express.Router();
var config = require("../config/private.json");
var cors = require('cors');
var bcrypt = require("bcrypt-nodejs");
var saltRounds = 10;
var _ = require('lodash');

var admin_firebase = require("firebase-admin");
var db = admin_firebase.database();
var usersRef = db.ref('users');
var subsidiary = db.ref('subsidiary');
var regSubsRef = db.ref('reg_subsidiary');
var partyInformation = db.ref('party_information');
var masterDetails = db.ref('master_details');
var vouchers = db.ref('vouchers');

var nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport(config.smtp);

router.post('/check_user', cors(), function (req, res, next) {
    req.assert('email', 'Email is required!').notEmpty();
    req.assert('password', 'Password is required!').notEmpty();
    req.getValidationResult().then(function (result) {
        var errors = result.useFirstErrorOnly().array();
        if (errors.length > 0) {
            return res.json({status: "failed", message: errors[0].msg});
        } else {
            usersRef.orderByChild('email').equalTo(req.body.email).once('value').then(function (userSnap) {
                let userData = userSnap.val();
                if (userData !== null) {
                    let keys = Object.keys(userData);
                    let sel_user = userData[keys[0]];
                    if (bcrypt.compareSync(req.body.password, sel_user.password)) {
                        if (sel_user.act_status) {
                            admin_firebase.auth().createCustomToken(keys[0]).then(function (token) {
                                return res.json({"status": "ok", "token": token});
                            }).catch(function (err) {
                                return res.json({"status": "failed", "message": "Error creating custom token: " + err});
                            });
                        } else {
                            return res.json({status: "failed", message: "Deactivate your account!"});
                        }
                    } else {
                        return res.json({status: "failed", message: "Invalid credentials!"});
                    }
                } else {
                    return res.json({status: "failed", message: "Invalid email!"});
                }
            });
        }
    });
});

router.get('/get_codes', function (req, res, next) {
    let project = req.query.project;
    let input = req.query.input;

    regSubsRef.child(project).once('value', function (snap) {
        if(snap.val() !== null){
            let grabDataArr = [];
            snap.forEach(function (childSnap) {
                let item = childSnap.val();
                item['_id'] = childSnap.key;
                grabDataArr.push(item);
            });

            let phase1 = _.filter(grabDataArr, function (o) {
                if(_.includes(o._id.toLowerCase(), input.toLowerCase())){
                    return true;
                } else {
                    return false;
                }
            });

            let phase2 = [];
            if(phase1.length > 0){
                phase1.forEach(function (item, ind, arr) {
                    subsidiary.child(item.key).once('value', function (subs_snap) {
                        if(subs_snap.val() !== null){
                            phase2.push({name: subs_snap.val().name, code: item._id});
                        }

                        if(ind === arr.length-1){
                            res.json({data: _.take(phase2, 5)});
                        }
                    });
                });
            }else{
                res.json({data: phase2});
            }
        }else{
            res.json({data: []});
        }
    });
});

router.get('/get_subs_name', function (req, res, next) {
    let project = req.query.project;
    let input = req.query.input;

    subsidiary.once('value', function (snap) {
        if(snap.val() !== null){
            let grabDataArr = [];
            snap.forEach(function (childSnap) {
                let item = childSnap.val();
                item['_id'] = childSnap.key;
                grabDataArr.push(item);
            });
            let phase1 = _.filter(grabDataArr, function (o) {
                if(_.includes(o.name.toLowerCase(), input.toLowerCase())){
                    return true;
                } else {
                    return false;
                }
            });

            let phase2 = [];
            if(phase1.length > 0){
                phase1.forEach(function (item, ind, arr) {
                    regSubsRef.child(project).orderByChild('key').equalTo(item._id).once('value', function (snap) {
                        if(snap.val() !== null){
                            phase2.push({name: item.name, code: Object.keys(snap.val())[0]});
                        }


                        if(ind === arr.length-1){
                            res.json({data: _.take(phase2, 5)});
                        }
                    });
                });
            }else{
                res.json({data: phase2});
            }

        } else {
            res.json({data: []});
        }
    });
});

router.post("/send_mail", function (req, res, next) {
    req.assert('email', 'Email is required!').notEmpty();
    req.getValidationResult().then(function (result) {
        var errors = result.useFirstErrorOnly().array();
        if (errors.length > 0) {
            return res.json({status: "failed", message: errors[0].msg});
        } else {
            usersRef.orderByChild('email').equalTo(req.body.email).once('value').then(function (userSnap) {
                let userData = userSnap.val();
                if (userData !== null) {
                    let keys = Object.keys(userData);
                    let sel_user = userData[keys[0]];
                    let randomStringPass = Math.random().toString(36).slice(-8);

                    if (sel_user.type === "admin") {
                        admin_firebase.auth().updateUser(keys[0], {
                            password: randomStringPass
                        }).then(function (userRecord) {
                            renderEmail(res, sel_user, randomStringPass, function (result) {
                                return res.json(result);
                            });
                        }).catch(function (err) {
                            console.log(err);
                            return res.json({status: "failed", message: "Firebase Auth Update Error!"});
                        });
                    } else {
                        let salt = bcrypt.genSaltSync(saltRounds);
                        let hashPass = bcrypt.hashSync(randomStringPass, salt);
                        usersRef.child(keys[0]).update({
                            password: hashPass
                        }, function (err) {
                            if (err) {
                                console.log(err);
                                return res.json({status: "failed", message: "Firebase Update Error!"});
                            }
                            renderEmail(res, sel_user, randomStringPass, function (result) {
                                return res.json(result);
                            });
                        });
                    }

                } else {
                    return res.json({status: "failed", message: "Invalid email!"});
                }
            });
        }
    });
});

router.post("/send_create_user_email", function (req, res, next) {
    req.assert('email', 'Email is required!').notEmpty();
    req.assert('password', 'Password is required!').notEmpty();
    req.assert('username', 'Username is required!').notEmpty();
    req.getValidationResult().then(function (result) {
        var errors = result.useFirstErrorOnly().array();
        if (errors.length > 0) {
            return res.json({status: "failed", message: errors[0].msg});
        } else {
            res.render("email_templates/create_user", {
                email: req.body.email,
                password: req.body.password,
                username: req.body.username
            }, function (errJade, html) {
                if (errJade) {
                    console.log(errJade);
                    return res.json({status: "failed", message: "Jade Error!"});
                }
                let mailOption = {
                    from: '"Finance Admin" <support@focusme360.com>',
                    to: req.body.email,
                    subject: 'New User',
                    html: html
                };
                transporter.sendMail(mailOption, function (err, info) {
                    if (err) {
                        console.log(err);
                        return res.json({status: "failed", message: "Error: Mail not send!"});
                    }
                    return res.json({status: "ok", info: info});
                });
            });
        }
    });
});

router.get("/search_pi", function (req, res, next) {
    let data = req.query;
    partyInformation.once('value', function (snap) {
        if(snap.val() !== null){
            let grabDataArr = [];
            snap.forEach(function (childSnap) {
                let item = childSnap.val();
                item['_id'] = childSnap.key;
                grabDataArr.push(item);
            });
            let reg = _.filter(grabDataArr, function (o) {
                if(_.includes(o.agent_name.toLowerCase(), data.search.toLowerCase())){
                    return true;
                }else if (_.includes(o.id.toString(), data.search.toString())) {
                    return true;
                }else if (_.includes(o.agent_code.toString(), data.search.toString())) {
                    return true;
                } else {
                    return false;
                }
            });
            res.json({data: _.take(reg, 5)});
        }else{
            res.json({data: []});
        }
    });
});

router.get("/search_md", function (req, res, next) {
    let data = req.query;
    masterDetails.once('value', function (snap) {
        if(snap.val() !== null){
            let grabDataArr = [];
            snap.forEach(function (childSnap) {
                let item = childSnap.val();
                item['_id'] = childSnap.key;
                grabDataArr.push(item);
            });
            let reg = _.filter(grabDataArr, function (o) {
                if(_.includes(o.allotee_name.toLowerCase(), data.search.toLowerCase())){
                    return true;
                }else if (_.includes(o.id.toString(), data.search.toString())) {
                    return true;
                }else if (_.includes(o.allotee_code.toString(), data.search.toString())) {
                    return true;
                } else {
                    return false;
                }
            });
            res.json({data: _.take(reg, 5)});
        }else{
            res.json({data: []});
        }
    });
});

router.get("/search_v", function (req, res, next) {
    let data = req.query;
    vouchers.once('value', function (snap) {
        if(snap.val() !== null){
            let grabDataArr = [];
            snap.forEach(function (childSnap) {
                let item = childSnap.val();
                item['_id'] = childSnap.key;
                grabDataArr.push(item);
            });
            let reg = _.filter(grabDataArr, function (o) {
                if(_.includes(o.v_remarks.toLowerCase(), data.search.toLowerCase())){
                    return true;
                }else if (_.includes(o.id.toString(), data.search.toString())) {
                    return true;
                } else {
                    return false;
                }
            });
            res.json({data: _.take(reg, 5)});
        }else{
            res.json({data: []});
        }
    });
});

module.exports = router;

function renderEmail(res, sel_user, newPass, callback) {
    res.render("email_templates/forgot_password", {
        name: sel_user.first_name,
        email: sel_user.email,
        password: newPass
    }, function (errJade, html) {
        if (errJade) {
            console.log(errJade);
            return callback({status: "failed", message: "Jade Error!"});
        }
        let mailOption = {
            from: '"Finance Admin" <support@focusme360.com>',
            to: sel_user.email,
            subject: 'Forgot Password!',
            html: html
        };
        transporter.sendMail(mailOption, function (err, info) {
            if (err) {
                console.log(err);
                return callback({status: "failed", message: "Error: Mail not send!"});
            }
            return callback({status: "ok", info: info});
        });
    });
}
