import firebase from 'firebase'

import SimpleVueValidation from 'simple-vue-validator'
const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        const db = firebase.database();
        self.projectsRef = db.ref('/projects');
        self.controlsRef = db.ref('/controls');

        self.projectsRef.on('value', function (snap) {
            let renderData = snap.val();
            if (renderData !== null) {
                self.proData = renderData;
            } else {
                self.proData = {};
            }
            self.dataLoad1 = false;
        });
    },
    data: function () {
        return {
            //loaders
            dataLoad1: true,
            dataLoad2: false,
            inProcess: false,

            // data save
            proData: {},
            controlData: {},

            // references
            projectsRef: null,
            controlsRef: null,

            // form fields
            sel_project: "",
            sel_control: "",
            sub_cont_name: "",
            debit: 0,
            credit: 0,
            errMain: "",
            sucMain: "",
        }
    },
    validators: {
        sel_project: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sel_control: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sub_cont_name: function (value) {
            let self = this;
            return Validator.custom(function () {
                self.cont_name = self.$root.trim(value);
            }).value(value).required().lengthBetween(3, 40);
        },
        debit: function (value) {
            let self = this;
            return Validator.custom(function () {
                self.debit = self.$root.isNumber(value, 100000);
            });
        },
        credit: function (value) {
            let self = this;
            return Validator.custom(function () {
                self.credit = self.$root.isNumber(value, 100000);
            });
        },
    },
    methods: {
        projectControlLoad: function(pro_key){
            let self = this;
            if(pro_key !== ""){
                self.dataLoad2 = true;
                self.dbLoadMet(function () {
                    self.controlsRef.child(pro_key).on('value', function (controlsSnap) {
                        let controlsData = controlsSnap.val();
                        if(controlsData !== null){
                            self.controlData = controlsData;
                        }else{
                            self.controlData = {};
                        }
                        self.sel_control = "";
                        self.dataLoad2 = false;
                    });
                }, 500);
            }else{
                self.dbLoadMet(function () {
                    self.sel_control = "";
                    self.controlData = {};
                    self.dataLoad2 = false;
                }, 0);
            }
        },
        addControl: function () {
            let self = this;
            self.$validate().then(function (success) {
                if (success) {
                    self.inProcess = true;
                    self.controlsRef
                        .child(self.sel_project)
                        .orderByChild('id')
                        .limitToLast(1)
                        .once('value')
                        .then(function (controlsSnap) {
                            let controlsData = controlsSnap.val();
                            let next_id = 1;
                            if(controlsData !== null){
                                let keys = Object.keys(controlsData);
                                next_id = parseInt(controlsData[keys[0]].id)+1;
                            }
                            self.controlsRef.child(self.sel_project).push({
                                id: next_id,
                                name: self.cont_name,
                                debit: self.debit,
                                credit: self.credit,
                            }, function (err) {
                                if(err){
                                    self.errMain = err.message;
                                }else{
                                    self.errMain = "";
                                    self.sucMain = "Successfully inserted control!";
                                    self.sel_project = "";
                                    self.cont_name = "";
                                    self.debit = 0;
                                    self.credit = 0;
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