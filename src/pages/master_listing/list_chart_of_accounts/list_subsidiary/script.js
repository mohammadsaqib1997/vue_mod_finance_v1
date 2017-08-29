import firebase from 'firebase'
import SimpleVueValidation from 'simple-vue-validator'
import func from '../../../../../custom_libs/func'

const Validator = SimpleVueValidation.Validator;

export default {
    created: function () {
        let self = this;

        self.$watch('sel_project', function (val, oldVal) {
            self.regSubsGet(val);
        });

        self.$watch('start_date', function (val, oldVal) {
            self.regSubsGet(self.sel_project);
        });

        self.$watch('end_date', function (val, oldVal) {
            self.regSubsGet(self.sel_project);
        });

        const db = firebase.database();
        self.projectsRef = db.ref('/projects');
        self.regSubsRef = db.ref('/reg_subsidiary');
        self.subsRef = db.ref('/subsidiary');

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
    data: function(){
        return {
            dbLoad: null,

            //loaders
            dataLoad1: true,
            dataLoad2: false,
            dataLoad3: false,

            // data save
            proData: {},
            subsData: {},

            // references
            projectsRef: null,
            subsRef: null,
            regSubsRef: null,

            // form fields
            sel_project: "",
            start_date: "",
            end_date: "",
            sel_subs_start: "",
            sel_subs_end: "",
            sel_show_type: "Screen",
        }
    },
    validators: {
        sel_project: function (value) {
            return Validator.value(value).required().lengthBetween(20, 36);
        },
        sel_subs_start: function (value) {
            return Validator.value(value).required().lengthBetween(3, 11, "Invalid Register Sub Control Id!");
        },
        sel_subs_end: function (value) {
            return Validator.value(value).required().lengthBetween(3, 11, "Invalid Register Sub Control Id!");
        },
        sel_show_type: function (value) {
            return Validator.value(value).required();
        }
    },
    methods: {
        regSubsGet: function (pro_key) {
            let self = this;
            self.dataLoad2 = true;
            self.sel_subs_start = "";
            self.sel_subs_end = "";
            self.subsData = {};
            if (pro_key !== "") {
                func.dbLoadMet(function () {
                    let s_time = 0;
                    let e_time = (new Date()).getTime();
                    if(self.start_date !== ""){
                        s_time = (new Date(self.start_date)).getTime();
                    }
                    if(self.end_date !== ""){
                        e_time = (new Date(self.end_date)).getTime();
                    }

                    self.regSubsRef.child(pro_key).orderByChild('createdAt').startAt(s_time).endAt(e_time).on('value', function (regSubsSnap) {
                        let data = regSubsSnap.val();
                        if (data !== null) {
                            let ids = Object.keys(data);
                            let ids_length = ids.length;
                            let process_item = 0;
                            self.sel_subs_start = "";
                            self.sel_subs_end = "";
                            self.subsData = {};
                            ids.forEach(function (id) {
                                let item = data[id];
                                self.subsRef.child(item.key).once('value').then(function (subsSnap) {
                                    let subsData = subsSnap.val();
                                    subsData['name'] = id + " " + subsData.name;
                                    self.subsData[id] = subsData;
                                    process_item++;
                                    if (process_item === ids_length) {
                                        self.subsData = func.sortObj(self.subsData, false);
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
                        self.formSubmit('/pdf/subsidiary/render.pdf', params);
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