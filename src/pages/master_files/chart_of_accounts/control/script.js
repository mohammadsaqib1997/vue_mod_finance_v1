import firebase from 'firebase'
import SimpleVueValidation from 'simple-vue-validator'
import func from '../../../../../custom_libs/func'

import addProjectModal from '../../../../partials/components/modals/add_project/add_project.vue'
import proSelControlModal from '../../../../partials/components/modals/proj_sel_control/proj_sel_control.vue'
import addControlModal from '../../../../partials/components/modals/add_control/add_control.vue'
import addSubControlModal from '../../../../partials/components/modals/add_sub_control/add_sub_control.vue'
import addSubsidiaryModal from '../../../../partials/components/modals/add_subsidiary/add_subsidiary.vue'

const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        self.$watch('sel_project', function (val, oldVal) {
            self.proSelContGet(val);
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
        self.proSelContRef = db.ref('/pro_sel_control');

        self.projectsRef.on('value', function (proSnap) {
            let renderData = proSnap.val();
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
            dbLoad: null,

            //loaders
            dataLoad1: true,
            dataLoad2: false,
            dataLoad3: false,
            inProcess: false,

            // data save
            proData: {},
            controlData: {},

            // references
            regControlsRef: null,
            controlsRef: null,
            projectsRef: null,
            proSelContRef: null,

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
        getObjId: func.getObjId,
        getObjKeyVal: func.getObjKeyVal,
        proSelContGet: function (pro_key) {
            let self = this;
            self.dataLoad2 = true;
            self.sel_control = "";
            self.controlData = {};
            if(pro_key !== ""){
                func.dbLoadMet(function () {
                    self.proSelContRef.child(pro_key).on('value', function (proSelContSnap) {
                        let data = proSelContSnap.val();
                        if(data !== null){
                            let keys = Object.keys(data);
                            let keys_length = keys.length;
                            let process_item = 0;
                            self.sel_control = "";
                            self.controlData = {};
                            keys.forEach(function (row) {
                                self.controlsRef.child(row).once('value').then(function (conSnap) {
                                    self.controlData[row] = conSnap.val();
                                    process_item++;
                                    if(process_item === keys_length){
                                        self.controlData = func.sortObj(self.controlData, false);
                                        self.dataLoad2 = false;
                                    }
                                });
                            });
                        }else{
                            self.dataLoad2 = false;
                        }
                    });
                }, 500, self.dbLoad);
            }else{
                self.dataLoad2 = false;
            }
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
                        'credit': self.credit,
                        'createdAt': firebase.database.ServerValue.TIMESTAMP
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
        proSelControlModal,
        addControlModal,
        addSubControlModal,
        addSubsidiaryModal
    }
}