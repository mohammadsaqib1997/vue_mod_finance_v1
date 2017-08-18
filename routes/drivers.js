var express = require('express');
var router = express.Router();
var func = require("./../custom_libs/func.js");
var csrf = require("csurf");
var bcrypt = require("bcrypt-nodejs");
var saltRounds = 10;

var accountSid = 'AC6ec73d56f86f97d0f12a74cac14c43b2';
var authToken = '03ba0841e8cd86e93dbb65709397e9e9';
var LookupsClient = require('twilio').LookupsClient;
var lookup_client = new LookupsClient(accountSid, authToken);

var config_gc = {
    projectId: 'radioapp-a8558',
    keyFilename: './config/serviceAccountKey.json'
};
var storage = require('@google-cloud/storage')(config_gc);
var bucket = storage.bucket('radioapp-a8558.appspot.com');

var admin = require("firebase-admin");
var db = admin.database();
var userRef = db.ref("users");
var complete_requestRef = db.ref("complete_requests");
var user_requestRef = db.ref("user_requests");
var drivers_bidRef = db.ref("driver_bids");
var webName = "ADMIN";

/*router.get('/', function (req, res, next) {
    userRef.orderByChild("type").equalTo("driver").limitToLast(15).once("value", function (snap) {
        var data = snap.val();
        var dataRe = {};
        if (data) {
            var keys = Object.keys(data).reverse();
            keys.forEach(function (val, i) {
                dataRe[val] = data[val];
                dataRe[val]['time'] = func.set_date_ser(new Date(func.decode_key(val)));
            });
            //res.json({dataRe :dataRe});
        }
        res.render('pages/drivers', {title: webName + ' | Drivers', page: "drivers", data: dataRe});
    });
});

router.get("/add_driver", csrf(), function(req, res, next){
    res.render("pages/add_driver", {title: webName + ' | Add Driver', page: "drivers", csrf: req.csrfToken()});
});*/

router.post("/add_driver", csrf(), function(req, res, next){
    req.sanitize("fname").trimVal();
    req.sanitize("lname").trimVal();
    req.sanitize("mobile_number").trimValRis();
    req.sanitize("cnic_number").trimValRis();
    req.sanitize("driving_license").trimVal();
    req.sanitize("email").trimVal();
    req.sanitize("model_year").trimValRis();
    req.sanitize("vehicle_number").trimValRis();
    req.sanitize("make").trimVal();

    req.assert('fname', 'First Name is required!').notEmpty().isLength({min: 2}).withMessage("First Name is too short!").isLength({max: 20}).withMessage("First Name is too long!");
    req.assert('lname', 'Last Name is required!').notEmpty().isLength({min: 2}).withMessage("Last Name is too short!").isLength({max: 20}).withMessage("Last Name is too long!");
    req.assert('mobile_number', 'Mobile Number is invalid!').notEmpty().withMessage("Mobile Number is required!").isInt().isLength({min: 11, max: 11});
    req.assert('cnic_number', 'CNIC Number is invalid!').notEmpty().withMessage("CNIC Number is required!").isInt().isLength({min: 13,max: 13});
    req.assert('driving_license', 'Driving License is required!').notEmpty().isLength({min: 5,max: 30}).withMessage("Driving License must be between 5 and 30 chars long!");
    req.assert('email', 'Email is required!').notEmpty().isEmail().withMessage("Invalid Email").isLength({max: 50}).withMessage("Email is too long!");
    req.assert('password', 'Password is required!').notEmpty().isLength({min: 6,max: 30}).withMessage("Password must be between 6 and 30 chars long!");
    req.assert('confirm_password', 'Confirm Password is required!').notEmpty().matchVal((typeof req.body.password !== "undefined") ? req.body.password : "").withMessage("Password not match!");
    req.assert('vehicle', 'Transportation Type is required!').notEmpty().matchVal("Bike|Car|Pickup|Truck").withMessage("Transportation Type is invalid!");
    req.assert('model_year', 'Model Year is invalid!').notEmpty().withMessage("Model Year is required!").isLength({min: 4,max: 4}).isInt();
    req.assert('vehicle_number', 'Vehicle Number is required!').notEmpty().isLength({min: 7,max: 7}).withMessage("Vehicle Number is invalid!");
    req.assert('make', 'Make is required!').notEmpty().isLength({min: 3,max: 20}).withMessage("Make must be between 3 and 20 chars long!");

    let errors;
    req.getValidationResult().then(function(result) {
        errors = result.useFirstErrorOnly().array();

        filesCheck({
            fm_profile_img: {
                title: "Profile Image",
                file: req.files.fm_profile_img
            },
            fm_cnic_img: {
                title: "Scanned CNIC",
                file: req.files.fm_cnic_img
            },
            fm_license_img: {
                title: "Scanned License",
                file: req.files.fm_license_img
            },
            fm_reg_letter_img: {
                title: "Scanned Registration Letter",
                file: req.files.fm_reg_letter_img
            }
        }, errors);

        driverEmailExist(req.body.email, 'email', function(obj){
            if (!obj.status) {
                errors.push(obj.err);
            }
            driverMobExist(req.body.mobile_number, "mobile_number", function (obj1) {
                if (!obj1.status) {
                    errors.push(obj1.err);
                }
                if (errors.length > 0) {
                    return res.json({status: "failed", errors: errors, csrf: req.csrfToken()});
                } else {
                    let salt = bcrypt.genSaltSync(saltRounds);
                    let hash = bcrypt.hashSync(req.body.password, salt);
                    let v_owner = (typeof req.body.vehicle_owner !== "undefined") ? "Yes" : "No";

                    let lastIdRef = userRef.push();
                    lastIdRef.set({
                        first_name: req.body.fname,
                        last_name: req.body.lname,
                        mob_no: "92" + (req.body.mobile_number * 1),
                        cnic_no: req.body.cnic_number,
                        driving_license: req.body.driving_license,
                        email: req.body.email,
                        password: hash,
                        vehicle: req.body.vehicle,
                        v_model_year: req.body.model_year,
                        v_number: req.body.vehicle_number,
                        v_make: req.body.make,
                        v_owner: v_owner,
                        status: 1,
                        type: 'driver',
                    }, function (err) {
                        if (err)
                            return res.json({
                                status: "failed",
                                errors: "Insertion Error: " + err,
                                csrf: req.csrfToken()
                            });
                        else {
                            fileUpload(req.files.fm_profile_img, lastIdRef.key, "profile_images/", function (err) {
                                if(err){
                                    return res.json({
                                        status: "failed",
                                        errors: "Profile Image Upload Error: " + err,
                                        csrf: req.csrfToken()
                                    });
                                }else{
                                    fileUpload(req.files.fm_cnic_img, lastIdRef.key, "driver_cnic_images/", function (err) {
                                        if(err){
                                            return res.json({
                                                status: "failed",
                                                errors: "CNIC Image Upload Error: " + err,
                                                csrf: req.csrfToken()
                                            });
                                        }else{
                                            fileUpload(req.files.fm_license_img, lastIdRef.key, "driver_license_images/", function (err) {
                                                if(err){
                                                    return res.json({
                                                        status: "failed",
                                                        errors: "License Image Upload Error: " + err,
                                                        csrf: req.csrfToken()
                                                    });
                                                }else{
                                                    fileUpload(req.files.fm_reg_letter_img, lastIdRef.key, "driver_registration_letter_images/", function (err) {
                                                        if(err){
                                                            return res.json({
                                                                status: "failed",
                                                                errors: "Registration Letter Image Upload Error: " + err,
                                                                csrf: req.csrfToken()
                                                            });
                                                        }else{
                                                            return res.json({status: "ok"});
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    });
});

/*
router.get('/request',function(req, res, next){
    userRef.orderByChild("type").equalTo("driver").once('value',function(snap){
        var data = snap.val();
        if(data !== null){
            var grab_data = {};
            for(var item in data){
                var select_data = data[item];
                if(select_data.status === 0){
                    grab_data[item] = select_data;
                    grab_data[item]['time'] = func.set_date_ser(new Date(func.decode_key(item)));
                }
            }
            return res.render('pages/driver_request',{data:grab_data, page: 'drivers'});
        }else{
            return res.render('pages/driver_request',{page: 'drivers'});
        }
    });

});

router.get('/profile/:id',function(req, res, next){
    var id = req.params.id;
    userRef.child(id).once('value',function(snap){
        var data = snap.val();
        if(data !== null){
            complete_requestRef.orderByChild('driver_uid').equalTo(id).once('value',function(snapshot){
                var grab_data = [];
                var req_data = snapshot.val();
                if(req_data !== null){
                    var keys = Object.keys(req_data).reverse();
                    var key_length = keys.length;
                    var processItem = 0;
                    keys.forEach(function (val, index) {
                        var completed_req_data = req_data[val];
                        user_requestRef.child(completed_req_data.client_uid+"/"+val).once('value',function (userReqSnap) {
                            var user_req_data = userReqSnap.val();
                            user_req_data['createdAt'] = func.set_date_ser(new Date(user_req_data.createdAt));
                            drivers_bidRef.child(val+"/"+id).once('value', function(bidSnap){
                                var bid_data = bidSnap.val();
                                userRef.child(completed_req_data.client_uid).once('value', function(clientSnap){
                                    var client_data = clientSnap.val();
                                    grab_data.push({
                                        client_data : client_data,
                                        driver_data : data,
                                        complete_request_data : completed_req_data,
                                        request_data : user_req_data,
                                        bid_data : bid_data
                                    });
                                    processItem++;
                                    if(processItem === key_length){
                                        return res.render('pages/driver_profile',{data:data, page: 'drivers', history_data : grab_data, user_type : "driver"});
                                    }
                                });
                            });
                        });

                    });
                }else{
                    return res.render('pages/driver_profile',{data: data, page: 'drivers', user_type : "driver"});
                }
            });

        }else{
            return res.redirect('/admin/drivers');
        }
    });

});
*/

module.exports = router;

function driverMobExist(mobile_number, f_name, callback) {
    mobile_number = "92" + (mobile_number * 1);
    lookup_client.phoneNumbers("+" + mobile_number).get(function (error, number) {
        if (error) {
            callback({"status": false, "err": {param: f_name, msg: "Mobile Number is invalid!"}});
        } else {
            userRef.orderByChild("mob_no").equalTo(mobile_number).once("value", function (snap) {
                var data = snap.val();
                if (data !== null) {
                    var match = false;
                    for (var item in data) {
                        var row = data[item];
                        if (row['type'] === "driver") {
                            match = true;
                            break;
                        }
                    }
                    if (match) {
                        callback({"status": false, "err": {param: f_name, msg: "Mobile Number is already exist!"}});
                    } else {
                        callback({"status": true});
                    }
                } else {
                    callback({"status": true});
                }
            });
        }
    });
}

function driverEmailExist(email, f_name, callback) {
    userRef.orderByChild("email").equalTo(email).once("value", function (snap) {
        var data = snap.val();
        if (data !== null) {
            var match = false;
            for (var item in data) {
                var row = data[item];
                if (row['type'] === "driver") {
                    match = true;
                    break;
                }
            }
            if (match) {
                callback({"status": false, "err": {param: f_name, msg: "Email is already exist!"}});
            } else {
                callback({"status": true});
            }
        } else {
            callback({"status": true});
        }
    });
}

function filesCheck(obj, errors){
    let filesKeys = Object.keys(obj);
    let filesLength = filesKeys.length;
    for(let i=0; i < filesLength; i++){
        let err = {};
        if(typeof obj[filesKeys[i]].file === "undefined"){
            err = { param: filesKeys[i], msg: obj[filesKeys[i]].title+" is required!" };
            errors.push(err);
        }
    }
}

function fileUpload(file, name, dir, callback) {
    if(typeof file !== "undefined"){
        var img_file = bucket.file(dir + name + ".jpg");
        var stream = img_file.createWriteStream({
            metadata: {
                contentType: "image/jpeg"
            },
            resumable: false
        });

        stream.on('error', (err) => {
            callback(err);
        });

        stream.on('finish', () => {
            callback(null);
        });

        stream.end(file.data);
    }else{
        callback("Invalid File!");
    }

}