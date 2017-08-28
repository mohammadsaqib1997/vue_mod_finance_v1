import firebase from 'firebase'
import SimpleVueValidation from 'simple-vue-validator'
import func from '../../../../../custom_libs/func'

const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        self.$watch('sel_project', function (val, oldVal) {
            self.proSelContGet(val);
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
            sel_control_start: "",
            sel_control_end: "",
            sel_show_type: "Screen",
        }
    },
    validators: {
        sel_project: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sel_control_start: function (value) {
            return Validator.value(value).required().lengthBetween(3, 11, "Invalid Register Control Id!");
        },
        sel_control_end: function (value) {
            return Validator.value(value).required().lengthBetween(3, 11, "Invalid Register Control Id!");
        },
        sel_show_type: function (value) {
            return Validator.value(value).required();
        }
    },
    methods: {
        proSelContGet: function (pro_key) {
            let self = this;
            self.dataLoad2 = true;
            self.sel_control_start = "";
            self.sel_control_end = "";
            self.controlData = {};
            if (pro_key !== "") {
                func.dbLoadMet(function () {
                    self.regControlsRef.child(pro_key).on('value', function (regContSnap) {
                        let data = regContSnap.val();
                        if (data !== null) {
                            let keys = Object.keys(data);
                            let keys_length = keys.length;
                            let process_item = 0;
                            self.sel_control_start = "";
                            self.sel_control_end = "";
                            self.controlData = {};
                            keys.forEach(function (row) {
                                let item = data[row];
                                self.controlsRef.child(item.key).once('value').then(function (contSnap) {
                                    let contData = contSnap.val();
                                    contData['name'] = row + " " + contData.name;
                                    self.controlData[row] = contData;
                                    process_item++;
                                    if (process_item === keys_length) {
                                        self.controlData = func.sortObj(self.controlData, false);
                                        self.dataLoad2 = false;
                                    }
                                });
                            });
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
                        self.formSubmit('/pdf/control/render.pdf', params);
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