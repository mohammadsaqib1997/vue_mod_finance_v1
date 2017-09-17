import firebase from 'firebase'
import SimpleVueValidation from 'simple-vue-validator'
import func from '../../../../custom_libs/func'

const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        self.$watch('sel_project', function (val, oldVal) {
            self.loadRegSubsidiary(val);
        });

        const db = firebase.database();
        self.projectsRef = db.ref('/projects');
        self.regSubsidiaryRef = db.ref('/reg_subsidiary');
        self.subsidiaryRef = db.ref('/subsidiary');

        self.projectsRef.on('value', function (proSnap) {
            let renderData = proSnap.val();
            if (renderData !== null) {
                self.proData = renderData;
            } else {
                self.proData = {};
            }
            self.dataLoad1 = false;
        });

        setTimeout(function () {
            $(function(){
                $(".datepicker").datepicker().on('change', function(e) {
                    let grabField = $(e.target);
                    if(grabField.hasClass('start_date')){
                        self.start_date = grabField.val();
                    }
                    if(grabField.hasClass('end_date')){
                        self.end_date = grabField.val();
                    }
                });
            });
        }, 100);
    },
    data: function () {
        return {
            dbLoad: null,

            //loaders
            dataLoad1: true,
            dataLoad2: false,

            // data save
            proData: {},
            regSubsData: {},

            // references
            projectsRef: null,
            regSubsidiaryRef: null,
            subsidiaryRef: null,

            // form fields
            sel_project: "",
            sel_subsidiary: "",
            start_date: "",
            end_date: "",
            sel_show_type: "Screen",
        }
    },
    validators: {
        sel_project: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        start_date: function (value) {
            return Validator.value(value).required().lengthBetween(10, 10, "Invalid Date!");
        },
        end_date: function (value) {
            return Validator.value(value).required().lengthBetween(10, 10, "Invalid Date!");
        },
        sel_subsidiary: function (value) {
            return Validator.value(value).required().lengthBetween(1, 20, "Invalid Id!");
        },
        sel_show_type: function (value) {
            return Validator.value(value).required();
        }
    },
    methods: {
        loadRegSubsidiary: function (sel_pro) {
            let self = this;
            self.dataLoad2 = true;
            self.sel_subsidiary = "";
            if(sel_pro !== ""){
                self.regSubsidiaryRef.child(sel_pro).on('value', function (regSubsSnap) {
                    let regSubsData = regSubsSnap.val();
                    if(regSubsData !== null){
                        let keys = Object.keys(regSubsData);
                        let process_item = 0;
                        keys.forEach(function (key) {
                            let item = regSubsData[key];
                            self.subsidiaryRef.child(item.key).once('value', function(subsSnap){
                                let subsData = subsSnap.val();
                                item['name'] = key+" | "+subsData.name;
                                self.regSubsData[key] = item;

                                process_item++;
                                if(process_item === keys.length){
                                    self.regSubsData = func.sortObj(self.regSubsData, false);
                                    self.dataLoad2 = false;
                                }
                            });
                        });
                    }else{
                        self.dataLoad2 = false;
                        self.regSubsData = {};
                    }
                });
            }else{
                self.dataLoad2 = false;
                self.regSubsData = {};
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
                        self.formSubmit('/pdf/detailed_ledger/render.pdf', params);
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