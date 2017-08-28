import firebase from 'firebase'
import SimpleVueValidation from 'simple-vue-validator'
import func from '../../../../../custom_libs/func'

const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        self.$watch('sel_project', function (val, oldVal) {
            self.proSelSubContGet(val);
        });


        const db = firebase.database();
        self.projectsRef = db.ref('/projects');
        self.contRef = db.ref('/controls');
        self.subContRef = db.ref('/sub_controls');
        self.regSubContRef = db.ref('/reg_sub_controls');
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

            // data save
            proData: {},
            contData: {},
            subContData: [],

            // references
            contRef: null,
            subContRef: null,
            projectsRef: null,
            regSubContRef: null,

            // form fields
            sel_project: "",
            sel_control: "",
            sel_subCont_start: "",
            sel_subCont_end: "",
            sel_show_type: "Screen",
        }
    },
    validators: {
        sel_project: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sel_subCont_start: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sel_subCont_end: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sel_show_type: function (value) {
            return Validator.value(value).required();
        }
    },
    methods: {
        proSelSubContGet: function (pro_key) {
            let self = this;
            self.dataLoad2 = true;
            self.sel_subCont_start = "";
            self.sel_subCont_end = "";
            self.subContData = [];
            if (pro_key !== "") {
                func.dbLoadMet(function () {
                    self.regSubContRef.child(pro_key).on('value', function (proSelContSnap) {
                        let data = proSelContSnap.val();
                        if (data !== null) {
                            let keys = Object.keys(data);
                            let keys_length = keys.length;
                            if(keys_length > 0){
                                let process_item = 0;
                                self.sel_subCont_start = "";
                                self.sel_subCont_end = "";
                                self.subContData = [];
                                keys.forEach(function (row) {
                                    self.subContRef.child(row).once('value').then(function (subContSnap) {
                                        let subContData = subContSnap.val();
                                        self.contRef.child(subContData.cont_key).once('value').then(function (contSnap) {
                                            let contData = contSnap.val();

                                            subContData['key'] = row;
                                            subContData['mixin_id'] = func.genInvoiceNo(contData.id, '00', 3)+func.genInvoiceNo(subContData.id, '000', 4);
                                            subContData['name'] = subContData.mixin_id + " " + subContData.name;

                                            self.subContData.push(subContData);

                                            process_item++;
                                            if (process_item === keys_length) {
                                                self.subContData = func.sortObjByVal(self.subContData, 'mixin_id');
                                                self.dataLoad2 = false;
                                            }
                                        });
                                    });
                                });
                            }else{
                                self.dataLoad2 = false;
                            }
                        } else {
                            self.dataLoad2 = false;
                        }
                    });
                }, 500, self.dbLoad);
            } else {
                self.dataLoad2 = false;
            }
        },
        showSheet: function (event) {
            let self = this;
            self.$validate().then(function (success) {
                if (success) {
                    let form = event.target;
                    let formData = new FormData(form);
                    let params = {};
                    for (let pair of formData.entries()) {
                        params[pair[0]] = pair[1];
                    }
                    firebase.auth().currentUser.getIdToken(true).then(function(idToken){
                        params['auth'] = idToken;
                        self.formSubmit('/pdf/sub_control/render.pdf', params);
                    }).catch(function(err){
                        console.log(err);
                    });
                }
            });
        },
        formSubmit: function (url, params) {
            let f = $("<form target='_blank' method='POST' style='display:none;'></form>").attr({
                action: url
            }).appendTo(document.body);

            for (let i in params) {
                if (params.hasOwnProperty(i)) {
                    $('<input type="hidden" />').attr({
                        name: i,
                        value: params[i]
                    }).appendTo(f);
                }
            }
            f.trigger('submit');
            f.remove();
        }
    }
}