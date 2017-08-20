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
            inProcess: false,

            // data save
            proData: {},

            // references
            projectsRef: null,
            controlsRef: null,

            // form fields
            sel_project: "",
            cont_name: "",
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
        cont_name: function (value) {
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
        }
    }
}