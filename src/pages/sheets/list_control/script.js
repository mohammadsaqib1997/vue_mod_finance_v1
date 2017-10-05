import firebase from 'firebase'
import moment from 'moment'

import downloadSheetModel from '../../../partials/components/modals/download_sheet/download_sheet.vue'

export default {
    created: function () {
        let self = this;
        let params = self.$route.params;
        let bw = [params.startId, params.endId];
        bw.sort();

        const db = firebase.database();
        self.projectRef = db.ref('/projects');
        self.controlsRef = db.ref('/controls');
        self.regControlsRef = db.ref('/reg_controls');

        self.projectRef.child(params.proId).on('value', function (proSnap) {
            let renderData = proSnap.val();
            if(renderData !== null){
                self.proName = renderData.name;
                self.optionalData.proName = self.proName;
                self.optionalData.date = self.date;

                self.regControlsRef.child(params.proId).orderByKey().startAt(bw[0]).endAt(bw[1]).once('value').then(function (regContSnap) {
                    let regContData = regContSnap.val();
                    if(regContData !== null){
                        let ids = Object.keys(regContData);
                        let ids_length = ids.length;
                        let process_item = 0;
                        let grabData = {};
                        ids.forEach(function (id) {
                            let row = regContData[id];
                            self.controlsRef.child(row.key).once('value').then(function (contSnap) {
                                grabData[id] = contSnap.val();
                                process_item++;
                                if(ids_length === process_item) {
                                    self.fetchData = grabData;
                                    self.dataLoad1 = false;
                                }
                            });
                        });
                    }else{
                        self.dataLoad1 = false;
                    }
                });
            }else{
                self.$router.push('/');
            }
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
            fetchData: {},
            optionalData: {
                title: 'MASTER LISTING',
                subTitle: 'CONTROL LISTING',
                proName: '',
                date: '',
            },

            // references
            regControlsRef: null,
            controlsRef: null,
            projectRef: null,

            proName: '',
            date: moment().format('DD/MM/YYYY'),
        }
    },
    methods: {

    },
    components: {
        downloadSheetModel
    }
}