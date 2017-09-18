import firebase from 'firebase'
import bcrypt from 'bcrypt-nodejs'

import SimpleVueValidation from 'simple-vue-validator'
import Promise from 'bluebird'

import comCities from '../../../partials/components/get_cities/get_cities.vue'

const Validator = SimpleVueValidation.Validator;
const saltRounds = 10;

export default {
    created: function () {
        let self = this;

        const db = firebase.database();
        self.usersRef = db.ref('/users');
        self.projectsRef = db.ref('/projects');

        self.projectsRef.on('value', function (proSnap) {
            let renderData = proSnap.val();
            if (renderData !== null) {
                self.proData = renderData;
            } else {
                self.proData = {};
            }
            self.dataLoad1 = false;
        });

        self.usersRef.orderByChild("type").equalTo("accountant").on('value', function (userSnap) {
            let renderData = userSnap.val();
            if (renderData !== null) {
                self.userData = renderData;
            } else {
                self.userData = {};
            }
            self.dataLoad2 = false;
        });

        $(function () {
            $('body').on('change', "#profile_img", function (e) {
                self.fileChange(e);
            });
        });
    },
    data: function () {
        return {
            //loaders
            inProcess: false,
            dataLoad1: true,
            dataLoad2: true,
            fileLoader: false,

            // data save
            proData: {},
            userData: {},

            // references
            projectsRef: null,
            usersRef: null,

            // form fields
            profile_img_src: "/assets/images/default-user.png",
            profile_img: null,
            pro_sel_type: "Select",
            first_name: "",
            last_name: "",
            email: "",
            mob_num: "",
            password: "",
            retype_password: "",
            gender: "Male",
            sel_project: [],
            zipcode: "",
            errMain: "",
            sucMain: "",
        }
    },
    watch: {
        profile_img: function (val) {
            let self = this;
            self.profile_img_src = "/assets/images/default-user.png";
            if (val !== null) {
                let reader = new FileReader();
                reader.onload = function (e) {
                    self.profile_img_src = e.target.result;
                };
                reader.readAsDataURL(val);
            }
        }
    },
    validators: {
        first_name: function (value) {
            return Validator.value(value).required().lengthBetween(3, 35);
        },
        last_name: function (value) {
            return Validator.value(value).required().lengthBetween(3, 35);
        },
        email: function (value) {
            let self = this;
            return Validator.value(value).required().maxLength(50).email().custom(function () {
                return Promise.delay(1000).then(function () {
                    return self.usersRef.orderByChild('email').equalTo(value).once('value').then(function (userSnap) {
                        let userData = userSnap.val();
                        if (userData !== null) {
                            return "Already taken!";
                        }
                    });
                });
            });
        },
        mob_num: function (value) {
            let msg = 'Invalid Phone/Mobile Number!';
            return Validator.value(value).required().digit(msg).lengthBetween(11, 11, msg);
        },
        password: function (value) {
            return Validator.value(value).required().lengthBetween(6, 35);
        },
        'retype_password, password': function (repeat, password) {
            return Validator.value(repeat).required().match(password);
        },
        gender: function (value) {
            return Validator.value(value).required().in(['Male', 'Female'], "Invalid Gender!");
        },
        sel_project: function (value) {
            let self = this;
            if (self.pro_sel_type === "Select") {
                return Validator.value(value).required();
            }
        },
        zipcode: function (value) {
            let msg = 'Invalid Zip code!';
            return Validator.value(value).required().digit(msg).lengthBetween(6, 6, msg);
        },
    },
    methods: {
        createUser: function () {
            let self = this;
            self.$validate().then(function (success_form) {
                self.$refs.sel_city.validate(function (success_city) {
                    if (success_form && success_city) {
                        self.inProcess = true;
                        self.usersRef
                            .orderByChild('id')
                            .limitToLast(1)
                            .once('value')
                            .then(function (userSnap) {
                                let userData = userSnap.val();
                                let next_id = 1;
                                if (userData !== null) {
                                    let keys = Object.keys(userData);
                                    next_id = parseInt(userData[keys[0]].id) + 1;
                                }
                                let salt = bcrypt.genSaltSync(saltRounds);
                                let newHash = bcrypt.hashSync(self.password, salt);
                                let push_gen = self.usersRef.push();
                                push_gen.set({
                                    id: next_id,
                                    first_name: self.first_name,
                                    last_name: self.last_name,
                                    email: self.email,
                                    mob_num: self.mob_num,
                                    password: newHash,
                                    gender: self.gender,
                                    projects: (self.pro_sel_type === "Select") ? self.sel_project : true,
                                    zipcode: self.zipcode,
                                    city: self.$refs.sel_city.query,
                                    act_status: true,
                                    type: "accountant",
                                    createdAt: firebase.database.ServerValue.TIMESTAMP
                                }, function (err) {
                                    if (err) {
                                        self.errMain = err.message;
                                        self.inProcess = false;
                                    } else {
                                        if (self.profile_img !== null) {
                                            self.upload_img(push_gen.key, function () {
                                                self.succMsg(self);
                                            });
                                        }else{
                                            self.succMsg(self);
                                        }
                                    }

                                });
                            });
                    }
                });
            });
        },
        active: function (key) {
            let self = this;
            self.usersRef.child(key).update({act_status: true});
        },
        deactive: function (key) {
            let self = this;
            self.usersRef.child(key).update({act_status: false});
        },
        fileChange: function (event) {
            let self = this;
            self.profile_img = null;
            let input = event.target;
            let grab_files = input.files;
            let ValidImageTypes = ["image/jpeg", "image/png"];
            if (grab_files.length > 0) {
                let grab_1_file = grab_files[0];
                if (ValidImageTypes.indexOf(grab_1_file["type"]) < 0 || grab_1_file["size"] > 2000000) {
                    $(input).replaceWith($(input).val("").clone(true));
                } else {
                    self.profile_img = grab_1_file;
                }
            }
        },
        upload_img: function (id, callback) {
            let self = this;
            let storage = firebase.storage();
            let uploadTask = storage.ref("profile_images/" + id + ".jpg")
                .put(self.profile_img);
            self.fileLoader = true;
            uploadTask.then(function (snap) {
                self.fileLoader = false;
                self.profile_img = null;
                $("#profile_img").replaceWith($("#profile_img").val("").clone(true));
                callback();
            }, function (err) {
                console.log(err.message_);
                self.fileLoader = false;
                self.profile_img = null;
                $("#profile_img").replaceWith($("#profile_img").val("").clone(true));
                callback();
            });
        },
        succMsg: function (self) {
            self.$http.post('/api/send_create_user_email', {
                email: self.frg_email,
            }).then(function (res) {
                console.log(res.body);
                /*let body = res.body;
                if (body.status === "ok") {
                    self.resetForms(true);
                    self.frgMsg = "Successfully Email Send!";
                } else {
                    self.frgErr = body.message;
                }
                self.frgProcess = false;*/
            }, function (err) {
                console.log(err);
                //self.frgProcess = false;
            });

            self.inProcess = false;
            self.errMain = "";
            self.sucMain = "Successfully Inserted User!";

            self.first_name = "";
            self.last_name = "";
            self.email = "";
            self.mob_num = "";
            self.password = "";
            self.retype_password = "";
            self.gender = "Male";
            self.sel_project = [];
            self.zipcode = "";
            self.pro_sel_type = "Select";
            self.$refs.sel_city.query = "";

            self.validation.reset();
            self.$refs.sel_city.validation.reset();
            setTimeout(function () {
                self.sucMain = "";
            }, 1500);
        }
    },
    components: {
        "com_cities": comCities
    }
}