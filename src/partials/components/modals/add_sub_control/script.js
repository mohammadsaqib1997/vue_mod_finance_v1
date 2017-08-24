import firebase from 'firebase'

import Promise from 'bluebird'
import SimpleVueValidation from 'simple-vue-validator'
const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        self.$watch('sub_cont_name', function (val, oldVal) {
            self.sub_cont_name = self.$root.trim(val);
        });

        const db = firebase.database();
        self.controlsRef = db.ref('/controls');
        self.subControlsRef = db.ref('/sub_controls');

        self.controlsRef.on('value', function (snap) {
            let renderData = snap.val();
            if (renderData !== null) {
                self.controlData = renderData;
            } else {
                self.controlData = {};
            }
            self.dataLoad1 = false;
        });
    },
    data: function () {
        return {
            //loaders
            dataLoad1: true,
            inProcess: false,

            // data save
            proData: {},
            controlData: {},

            // references
            controlsRef: null,
            subControlsRef: null,

            // form fields
            sel_control: "",
            sub_cont_name: "",
            errMain: "",
            sucMain: "",
        }
    },
    validators: {
        sel_control: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sub_cont_name: function (value) {
            let self = this;
            return Validator.value(value).required().lengthBetween(3, 40).custom(function () {
                return Promise.delay(1000).then(function () {
                    if(self.sel_control !== ""){
                        return self.subControlsRef.child(self.sel_control).orderByChild('name').equalTo(value).once('value').then(function (subContSnap) {
                            let subContData = subContSnap.val();
                            if(subContData !== null){
                                return "Already taken!";
                            }
                        });
                    }
                });
            });
        }
    },
    methods: {
        addSubControl: function () {
            let self = this;
            self.$validate().then(function (success) {
                if (success) {
                    self.inProcess = true;
                    self.subControlsRef
                        .child(self.sel_control)
                        .orderByChild('id')
                        .limitToLast(1)
                        .once('value')
                        .then(function (subControlsSnap) {
                            let subControlsData = subControlsSnap.val();
                            let next_id = 1;
                            if(subControlsData !== null){
                                let keys = Object.keys(subControlsData);
                                next_id = parseInt(subControlsData[keys[0]].id)+1;
                            }
                            self.subControlsRef.child(self.sel_control).push({
                                id: next_id,
                                name: self.sub_cont_name
                            }, function (err) {
                                if(err){
                                    self.errMain = err.message;
                                }else{
                                    self.errMain = "";
                                    self.sucMain = "Successfully inserted sub control!";
                                    self.sel_control = "";
                                    self.sub_cont_name = "";
                                    self.validation.reset();
                                    setTimeout(function () {
                                        self.sucMain = "";
                                    }, 1500);
                                }
                                self.inProcess = false;
                            });
                        });
                }
            });
        },
        dbLoadMet: function (func, time) {
            let self = this;
            if(self.dbLoad !== null){
                clearTimeout(self.dbLoad);
                self.dbLoad = null;
                self.dbLoadMet(func, time);
            }else{
                self.dbLoad = setTimeout(func, time);
            }
        }
    }
}