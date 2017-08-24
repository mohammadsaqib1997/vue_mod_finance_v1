import firebase from 'firebase'
import SimpleVueValidation from 'simple-vue-validator'

import addProjectModal from '../../../../partials/components/modals/add_project/add_project.vue'
import addControlModal from '../../../../partials/components/modals/add_control/add_control.vue'

const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        self.$watch('sel_project', function (val, oldVal) {
            self.loadDataCont(val, self.sel_control);
        });
        self.$watch('sel_control', function (val, oldVal) {
            self.loadDataCont(self.sel_project, val);
        });
        self.$watch('debit', function (val, oldVal) {
            self.debit = self.$root.isNumber(val, 100000);
        });
        self.$watch('credit', function (val, oldVal) {
            self.credit = self.$root.isNumber(val, 100000);
        });

        const db = firebase.database();
        self.projectsRef = db.ref('/projects');
        self.controlsRef = db.ref('/controls');
        self.regControlsRef = db.ref('/reg_controls');

        self.projectsRef.on('value', function (proSnap) {
            let renderData = proSnap.val();
            if (renderData !== null) {
                self.proData = renderData;
            } else {
                self.proData = {};
            }
            self.dataLoad1 = false;
        });

        self.controlsRef.on('value', function (contSnap) {
            let renderData = contSnap.val();
            if (renderData !== null) {
                self.controlData = renderData;
            } else {
                self.controlData = {};
            }
            self.dataLoad2 = false;
        });
    },
    data: function () {
        return {
            dbLoad: null,

            //loaders
            dataLoad1: true,
            dataLoad2: true,
            dataLoad3: false,
            inProcess: false,

            // data save
            proData: {},
            controlData: {},

            // references
            regControlsRef: null,
            controlsRef: null,
            projectsRef: null,

            // form fields
            sel_project: "",
            sel_control: "",
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
        debit: function (value) {
            return Validator.value(value).required();
        },
        credit: function (value) {
            return Validator.value(value).required();
        }
    },
    methods: {
        getObjId: function (sel_key, obj) {
            if (sel_key !== "") {
                if (typeof obj[sel_key] !== "undefined") {
                    return (typeof obj[sel_key].id !== "undefined") ? obj[sel_key].id : "";
                }
            }
            return "";
        },
        getObjKeyVal: function (sel_key, obj, key) {
            if (sel_key !== "") {
                if (typeof obj[sel_key] !== "undefined") {
                    return (typeof obj[sel_key][key] !== "undefined") ? obj[sel_key][key] : "";
                }
            }
            return "";
        },
        loadDataCont: function (pro_key, cont_key) {
            let self = this;
            if(pro_key !== "" && cont_key !== ""){
                self.dataLoad3 = true;
                self.regControlsRef.child(pro_key+"/"+cont_key).once('value').then(function (regContSnap) {
                    let regContData = regContSnap.val();
                    if(regContData !== null){
                        self.debit = regContData.debit;
                        self.credit = regContData.credit;
                    }else{
                        self.debit = 0;
                        self.credit = 0;
                    }
                    self.dataLoad3 = false;
                });
            }else{
                self.debit = 0;
                self.credit = 0;
            }
        },
        addContEntry: function () {
            let self = this;
            self.$validate().then(function (success) {
                if (success) {
                    self.inProcess = true;
                    self.regControlsRef.child(self.sel_project+"/"+self.sel_control).set({
                        'debit': self.debit,
                        'credit': self.credit
                    }, function (err) {
                        if(err){
                            self.errMain = err.message;
                        }else{
                            self.errMain = "";
                            self.sucMain = "Successfully inserted control amount!";
                            self.sel_project = "";
                            self.sel_control = "";
                            self.debit = 0;
                            self.credit = 0;
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
    },
    components: {
        addProjectModal,
        addControlModal
    }
}