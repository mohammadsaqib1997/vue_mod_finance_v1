import firebase from 'firebase'
import func from '../../../../custom_libs/func'
import moment from 'moment'

export default {
    created: function () {
        let self = this;
        let params = self.$route.params;
        let bw = [params.startId, params.endId];
        bw.sort();
        console.log(bw);

        const db = firebase.database();
        self.projectRef = db.ref('/projects');
        self.controlsRef = db.ref('/controls');
        self.regControlsRef = db.ref('/reg_controls');
        self.proSelContRef = db.ref('/pro_sel_control');

        self.projectRef.child(params.proId).on('value', function (proSnap) {
            let renderData = proSnap.val();
            if(renderData !== null){
                self.proName = renderData.name;
            }else{
                self.$router.push('/');
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
            projectRef: null,
            proSelContRef: null,

            proName: '',
            date: moment().format('DD/MM/YYYY'),
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