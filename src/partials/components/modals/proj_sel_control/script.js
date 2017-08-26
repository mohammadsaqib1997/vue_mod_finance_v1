import firebase from 'firebase'
import func from '../../../../../custom_libs/func'
import Promise from 'bluebird'
import SimpleVueValidation from 'simple-vue-validator'
const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        const db = firebase.database();
        self.controlsRef = db.ref('/controls');
        self.projectsRef = db.ref('/projects');
        self.proSelControlRef = db.ref('/pro_sel_control');

        self.projectsRef.on('value', function (proSnap) {
            let data = proSnap.val();
            if (data !== null) {
                self.projectData = data;
            } else {
                self.projectData = {};
            }
            self.sel_project = "";
            self.dataLoad1 = false;
        });

        self.controlsRef.on('value', function (contSnap) {
            let data = contSnap.val();
            if (data !== null) {
                self.controlData = data;
            } else {
                self.controlData = {};
            }
            self.sel_control = "";
            self.dataLoad2 = false;
        });
    },
    data: function () {
        return {
            //loaders
            dataLoad1: true,
            dataLoad2: true,
            inProcess: false,

            // db reference
            projectsRef: null,
            controlsRef: null,
            proSelControlRef: null,

            // db reference
            projectData: {},
            controlData: {},

            // form fields
            sel_project: "",
            sel_control: "",
            errMain: "",
            sucMain: "",
        }
    },
    validators: {
        sel_project: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sel_control: function (value) {
            let self = this;
            return Validator.value(value).required().lengthBetween(20, 36).custom(function () {
                return Promise.delay(1000).then(function () {
                    if (self.sel_control !== "" && self.sel_project !== "") {
                        return self.proSelControlRef
                            .child(self.sel_project + "/" + self.sel_control)
                            .once('value').then(function (snap) {
                                if(snap.val() !== null){
                                    return "Already Selected!";
                                }
                            });
                    }
                });
            });
        }
    },
    methods: {
        addControl: function () {
            let self = this;
            self.$validate().then(function (success) {
                if (success) {
                    self.inProcess = true;
                    self.proSelControlRef
                        .child(self.sel_project + "/" + self.sel_control)
                        .set(true, function (err) {
                            if (err) {
                                self.errMain = err.message;
                            } else {
                                self.errMain = "";
                                self.sucMain = "Successfully added control in project!";
                                self.sel_project = "";
                                self.sel_control = "";
                                self.validation.reset();
                                setTimeout(function () {
                                    self.sucMain = "";
                                }, 1500);
                            }
                            self.inProcess = false;
                        });
                }
            });
        }
    }
}