var express = require('express');
var router = express.Router();
var bcrypt = require("bcrypt-nodejs");
var saltRounds = 10;

var admin = require("firebase-admin");
var db = admin.database();
var userRef = db.ref("users");
var forgotPassToken = db.ref("forgot_pass_token");

var accountSid = 'AC6ec73d56f86f97d0f12a74cac14c43b2';
var authToken = '03ba0841e8cd86e93dbb65709397e9e9';
// var RestClient = require('twilio').RestClient;
var LookupsClient = require('twilio').LookupsClient;

// var rest_client = new RestClient(accountSid, authToken);
var lookup_client = new LookupsClient(accountSid, authToken);

var UfoneLib = require("./../custom_libs/ufone_lib");

/*router.get("/check_sms", function(req, res, next){
    var u_sms = new UfoneLib();
    u_sms.set_sms("Check Message Via API", "923062064280");
    u_sms.send(function (result) {
        res.json(result);
    })
});*/

/*router.post("/new_req_send", function (req, res, next) {
    userRef.orderByChild("type").equalTo("driver").limitToFirst(15).once("value", function (snap) {
        /!*res.json(snap);*!/
        var data = snap.val();
        if (data) {
            var i = 0;
            var dataLength = Object.keys(data).length;
            for (var dd in data) {
                i++;
                var singleRow = data[dd];
                var phoneNum = singleRow["mob_no"];

                rest_client.messages.create({
                    body: 'A new request has been posted.',
                    to: "+" + phoneNum,  // Text this number
                    from: '+19718034496'
                }, function (err, msg) {
                    console.log(err);
                });

                if (dataLength <= i) {
                    res.json({"status": "ok"});
                }
            }
        } else {
            res.json({"status": "failed"});
        }
    });
});*/

router.post('/forgot_password', function(req, res, next){
    req.sanitize("mob_no").trimVal();
    req.sanitize("type").trimVal();
    req.assert('mob_no', "Mobile Number is invalid!").notEmpty().withMessage('Mobile Number is required!').isLength({min:12, max:12}).isInt();
    req.assert('type', 'Type is required!').notEmpty().matchVal("client|driver").withMessage("Type is invalid!");

    req.getValidationResult().then(function(result){
        var errors = result.useFirstErrorOnly().array();
        if(errors.length > 0){
            return res.json({status: "failed", message: errors[0].msg});
        }else{
            var mob_no = req.body.mob_no;
            var type = req.body.type;
            userRef.orderByChild("mob_no").equalTo(mob_no).once("value", function (snap) {
                var data = snap.val();
                if(data !== null){
                    var valid = false;
                    var selData;
                    var selKey;
                    for(var item in data){
                        selData = data[item];
                        selKey = item;
                        if(selData.type === type){
                            valid = true;
                            break;
                        }
                    }
                    if(valid) {
                        var code = Math.floor(Math.random() * 900000) + 100000;
                        var setData = {mob_no: mob_no, token: code, type: type, time: admin.database.ServerValue.TIMESTAMP};
                        forgotPassToken.child(selKey).set(setData, function (err) {
                            if (err) {
                                return res.json({status: "failed", message: err.message});
                            }
                            var u_sms = new UfoneLib();
                            u_sms.set_sms('Forgot Password token is: "' + code, mob_no);
                            u_sms.send(function (result) {
                                if (result.response_to_browser.response_id[0] === "0") {
                                    return res.json({"status": "ok", "token": code});
                                } else {
                                    return res.json({
                                        "status": "failed",
                                        "message": result.response_to_browser.response_text[0]
                                    });
                                }
                            });
                        });
                    }else{
                        return res.json({status: "failed", message: "Mobile Number is not found!"});
                    }
                }else{
                    return res.json({status: "failed", message: "Mobile Number is not found!"});
                }
            });
        }
    });
});

router.post('/new_password', function(req, res, next){
    req.sanitize("mob_no").trimVal();
    req.sanitize("type").trimVal();
    req.sanitize("token").trimVal();
    req.assert('mob_no', "Mobile Number is invalid!").notEmpty().withMessage('Mobile Number is required!').isLength({min:12, max:12}).isInt();
    req.assert('token', 'Token is invalid!').notEmpty().withMessage("Token is required!").isLength({min:6, max:6}).isInt();
    req.assert('password', 'Password is required!').notEmpty().isLength({min:6, max:30}).withMessage("Password must be between 6 and 30 chars long!");
    req.assert('type', 'Type is required!').notEmpty().matchVal("client|driver").withMessage("Type is invalid!");

    req.getValidationResult().then(function(result){
        var errors = result.useFirstErrorOnly().array();
        if(errors.length > 0){
            return res.json({status: "failed", message: errors[0].msg});
        }else{
            var mob_no = req.body.mob_no;
            var token = req.body.token;
            var password = req.body.password;
            var type = req.body.type;
            forgotPassToken.orderByChild("mob_no").equalTo(mob_no).once("value", function(snap){
                var data = snap.val();
                if(data !== null){
                    //var time = new Date(data.time);
                    //var cur_time = new Date();
                    //var diff_time = cur_time.getTime() - time.getTime();
                    var valid = false;
                    var selData;
                    var selKey;
                    for(var item in data){
                        selData = data[item];
                        selKey = item;
                        if(selData.type === type && selData.token == token){
                            valid = true;
                            break;
                        }
                    }
                    if(valid){
                        var salt = bcrypt.genSaltSync(saltRounds);
                        var newHash = bcrypt.hashSync(password, salt);
                        userRef.child(selKey).update({
                            "password": newHash,
                        }, function (err) {
                            if (err) {
                                return res.json({status: "failed", message: "Data could not be saved. " + err});
                            } else {
                                forgotPassToken.child(selKey).remove(function(err){
                                    if(!err){
                                        return res.json({status: "ok", message: "Password has been changed!"});
                                    }
                                    return res.json({status: "failed", message: "Data could not be deleted. " + err});
                                });
                            }
                        });
                    }else{
                        return res.json({status: "failed", message: "Invalid Request!"});
                    }
                }else{
                    return res.json({status: "failed", message: "Invalid Request!"});
                }
            });
        }
    });
});

router.post('/update_password', function(req, res, next){
    req.sanitize("uid").trimVal();
    req.sanitize("type").trimVal();

    req.assert('uid', 'UID is required!').notEmpty();
    req.assert('new_pass', 'New Password is required!').isLength({min: 6,max: 30}).withMessage("Password must be between 6 and 30 chars long!");
    req.assert('old_pass', 'Old Password is required!').notEmpty();
    req.assert('type', 'Type is required!').notEmpty().matchVal("client|driver").withMessage("Type is invalid!");

    req.getValidationResult().then(function(result) {
        var errors = result.useFirstErrorOnly().array();
        if(errors.length > 0){
            return res.json({status: "failed", message: errors[0].msg});
        }else{
            var uid = req.body.uid;
            var old_pass = req.body.old_pass;
            var new_pass = req.body.new_pass;
            var type = req.body.type;

            userRef.child(uid).once("value").then(function (snap) {
                var data = snap.val();
                if(data === null){
                    return res.json({status: "failed", message: "Invalid User!"});
                }else{
                    if(data.type === type){
                        if(bcrypt.compareSync(old_pass, data.password)){
                            var salt = bcrypt.genSaltSync(saltRounds);
                            var newHash = bcrypt.hashSync(new_pass, salt);
                            userRef.child(uid).update({
                                "password": newHash,
                            }, function (err) {
                                if (err) {
                                    res.json({"status": "failed", message: "Data could not be saved. " + err});
                                } else {
                                    return res.json({status: "ok", message: "Password has been changed!"});
                                }
                            });
                        }else{
                            return res.json({status: "failed", message: "Incorrect Password!"});
                        }
                    }else{
                        return res.json({status: "failed", message: "Invalid User!"});
                    }
                }
            });
        }
    });
});

router.post('/validate', function (req, res, next) {
    if ((typeof req.body.phone_num === "undefined" || req.body.phone_num === "") || (typeof req.body.type === "undefined" || req.body.type === "")) {
        res.json({"status": "failed", "message": "Invalid Request!"});
    } else {
        var phone_num = req.body.phone_num;
        var user_type = req.body.type;
        lookup_client.phoneNumbers("+" + phone_num).get(function (error, number) {
            if (error) {
                res.json({"status": "failed", "message": error.message});
            } else {
                userRef.once("value", function (snap) {
                    var data = snap.val();
                    var check = false;
                    for (var dd in data) {
                        var singleRow = data[dd];
                        if (singleRow["mob_no"] === phone_num && user_type === singleRow["type"]) {
                            check = true;
                            break;
                        }
                    }
                    if (check) {
                        res.json({"status": "failed", "message": "User already exist!"});
                    } else {
                        var code = Math.floor(Math.random() * 900000) + 100000;
                        var u_sms = new UfoneLib();
                        u_sms.set_sms('Your auth token is: "' + code, phone_num);
                        u_sms.send(function (result) {
                            if(result.response_to_browser.response_id[0] === "0"){
                                return res.json({"status": "ok", "token": code});
                            }else{
                                return res.json({"status": "failed", "message": result.response_to_browser.response_text[0]});
                            }
                        });
                    }
                });
            }
        });
    }
});

router.post('/register', function (req, res, next) {
    var params = req.body;
    var req_params = [
        'email',
        'mob_no',
        'first_name',
        'last_name',
        'password',
        'type'
    ];
    if (params.hasOwnProperty("type")) {
        if (params.type === "driver") {
            req_params.push("vehicle");
        }
    }
    var errMsg = "Invalid Request!";
    //extra field check loop
    var valid = reqCheck(params, req_params);
    //required field check loop
    if (valid) {
        req_params.forEach(function (val, ind) {
            if (!params.hasOwnProperty(val)) {
                valid = false;
                return false;
            }
            if (ind === 0) {
                var retMsg = validField(params);
                if (retMsg !== "") {
                    errMsg = retMsg;
                    valid = false;
                    return false;
                }
            }
        });
    }

    if (!valid) {
        res.json({"status": "failed", "message": errMsg});
    } else {
        lookup_client.phoneNumbers("+" + params["mob_no"]).get(function (error, number) {
            if (error) {
                res.json({"status": "failed", "message": error.message});
            } else {
                userRef.once("value", function (snap) {
                    var data = snap.val();
                    var mob_no_check = false;
                    var email_check = false;
                    for (var dd in data) {
                        var singleRow = data[dd];
                        var mob_no = singleRow["mob_no"];
                        var email = singleRow["email"];
                        var type = singleRow["type"];
                        if (mob_no === params['mob_no'] && type === params['type']) {
                            mob_no_check = true;
                            break;
                        } else if (email === params['email'] && type === params['type']) {
                            email_check = true;
                            break;
                        }
                    }
                    if (mob_no_check) {
                        res.json({"status": "failed", "message": "Mobile number is already exist!"});
                    } else if (email_check) {
                        res.json({"status": "failed", "message": "Email is already exist!"});
                    } else {
                        var newUser = userRef.push();
                        var uid = newUser.key;
                        var salt = bcrypt.genSaltSync(saltRounds);
                        var hash = bcrypt.hashSync(params.password, salt);
                        var sendVal;
                        if (params.hasOwnProperty('vehicle')) {
                            sendVal = {
                                "email": params.email,
                                "password": hash,
                                "first_name": params.first_name,
                                "last_name": params.last_name,
                                "mob_no": params.mob_no,
                                "vehicle": params.vehicle,
                                "type": params.type
                            };
                        } else {
                            sendVal = {
                                "email": params.email,
                                "password": hash,
                                "first_name": params.first_name,
                                "last_name": params.last_name,
                                "mob_no": params.mob_no,
                                "type": params.type
                            };
                        }

                        newUser.set(sendVal, function (err) {
                            if (err) {
                                res.json({"status": "failed", "message": "Data could not be saved. " + err});
                            } else {
                                admin.auth().createCustomToken(uid).then(function (token) {
                                    res.json({"status": "ok", "token": token});
                                }).catch(function (err) {
                                    res.json({"status": "failed", "message": "Error creating custom token: " + err});
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});

router.post('/login', function (req, res, next) {
    var params = req.body;
    var req_params = ["email", "password", "type"];
    var errMsg = "Invalid Request!";

    var valid = reqCheck(params, req_params);
    if (valid) {
        valid = revReqCheck(params, req_params);
    }

    if (!valid) {
        return res.json({"status": "failed", "message": errMsg});
    } else {
        userRef.once("value", function (snap) {
            var data = snap.val();
            if (data !== null) {
                //res.json({"status": "ok", "data": data});
                var validC = false;
                var uid;
                for (var dd in data) {
                    var singleRow = data[dd];
                    uid = dd;
                    var email = singleRow["email"];
                    var type = singleRow["type"];
                    var passwordHash = singleRow["password"];
                    if (email === params['email'] && type === params['type']) {
                        if (bcrypt.compareSync(params['password'], passwordHash)) {
                            validC = true;
                        }
                        break;
                    }
                }
                if (!validC) {
                    return res.json({"status": "failed", "message": "Invalid Credentials!"});
                } else {
                    admin.auth().createCustomToken(uid).then(function (token) {
                        return res.json({"status": "ok", "token": token});
                    }).catch(function (err) {
                        return res.json({"status": "failed", "message": "Error creating custom token: " + err});
                    });
                }
            } else {
                return res.json({"status": "failed", "message": "Invalid Credentials!"});
            }
        });
        //res.json({"status": "ok", "params": params});
    }
});

module.exports = router;

function validField(params) {
    if (params.hasOwnProperty("email")) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(params["email"])) {
            return "Invalid Email Address!";
        }
    }
    if (params.hasOwnProperty("type")) {
        var req = ["driver", "client"];
        if (req.indexOf(params["type"]) == -1) {
            return "Invalid Type!";
        }
    }
    if (params.hasOwnProperty("first_name")) {
        if (params["first_name"].length < 3) {
            return "First Name is too short!";
        } else if (params["first_name"].length > 35) {
            return "First Name is too long!";
        }
    }
    if (params.hasOwnProperty("last_name")) {
        if (params["last_name"].length < 3) {
            return "Last Name is too short!";
        } else if (params["last_name"].length > 35) {
            return "Last Name is too long!";
        }
    }
    if (params.hasOwnProperty("password")) {
        if (params["password"].length < 5) {
            return "Password is too short!";
        } else if (params["password"].length > 35) {
            return "Password is too long!";
        }
    }
    return "";
}

function reqCheck(params, req_params) {
    for (var key in params) {
        if (req_params.indexOf(key) === -1) {
            return false;
        }
    }
    return true;
}
function revReqCheck(params, req_params) {
    var check = true;
    req_params.forEach(function (val, ind) {
        if (!params.hasOwnProperty(val)) {
            check = false;
            return false;
        }
    });
    return check;
}