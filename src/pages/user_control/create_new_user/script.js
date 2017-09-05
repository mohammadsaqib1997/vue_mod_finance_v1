import firebase from 'firebase'
import func from '../../../../custom_libs/func'
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

        self.usersRef.on('value', function (userSnap) {
            let renderData = userSnap.val();
            if (renderData !== null) {
                self.userData = renderData;
            } else {
                self.userData = {};
            }
            self.dataLoad2 = false;
        });
    },
    data: function(){
        return {
            //loaders
            inProcess: false,
            dataLoad1: true,
            dataLoad2: true,

            // data save
            proData: {},
            userData: {},

            // references
            projectsRef: null,
            usersRef: null,

            // form fields
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
                        if(userData !== null){
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
            if(self.pro_sel_type === "Select"){
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
                    if(success_form && success_city){
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
                                self.usersRef.push({
                                    id: next_id,
                                    first_name: self.first_name,
                                    last_name: self.last_name,
                                    email: self.email,
                                    mob_num: self.mob_num,
                                    password: newHash,
                                    gender: self.gender,
                                    projects: (self.sel_project.length > 0) ? self.sel_project: true,
                                    zipcode: self.zipcode,
                                    city: self.$refs.sel_city.query,
                                    act_status: true,
                                    createdAt: firebase.database.ServerValue.TIMESTAMP
                                }, function (err) {
                                    if (err) {
                                        self.errMain = err.message;
                                    } else {
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
                                    self.inProcess = false;
                                });
                            });
                    }
                });
            });
        },
        active: function (key) {
            let self = this;
            self.usersRef.child(key).update({act_status:true});
        },
        deactive: function (key) {
            let self = this;
            self.usersRef.child(key).update({act_status:false});
        }
    },
    components: {
        "com_cities": comCities
    }
}