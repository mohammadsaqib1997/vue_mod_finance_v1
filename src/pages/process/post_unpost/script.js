import firebase from 'firebase'
import func from '../../../../custom_libs/func'

export default {
    created: function () {
        let self = this;

        const db = firebase.database();
        self.projectsRef = db.ref('/projects');
        self.vouchersRef = db.ref('/vouchers');
        self.vouchersEntriesRef = db.ref('/vouchers_entries');

        self.vouchersRef.on('value', function (snap) {
            let renderData = snap.val();
            if (renderData !== null) {
                let keys = Object.keys(renderData);
                let process_item = 0;
                keys.forEach(function (key) {
                    let item = renderData[key];
                    self.projectsRef.child(item.sel_project).once("value", function (proSnap) {
                        let proData = proSnap.val();
                        item['project'] = proData.name;
                        self.vouchersData[key] = item;

                        process_item++;
                        if(process_item === keys.length){
                            self.vouchersData = func.sortObj(self.vouchersData, false);
                            self.dataLoad1 = false;
                        }
                    });
                });
            } else {
                self.vouchersData = {};
                self.dataLoad1 = false;
            }
        });
    },
    data: function(){
        return {
            //loaders
            dataLoad1: true,

            //data
            vouchersData: {},
            voucherEntriesData: {},

            //references
            projectsRef: null,
            vouchersRef: null,
            vouchersEntriesRef: null,
        }
    },
    methods: {
        formatDate: function (date) {
            return func.getDate(date);
        },
        active: function (key) {
            this.vouchersRef.child(key).update({
                posted_status: "Yes"
            }, function(err){
                if(err){
                    console.log(err);
                }
            });
        },
        deactive: function (key) {
            this.vouchersRef.child(key).update({
                posted_status: "No"
            }, function(err){
                if(err){
                    console.log(err);
                }
            });
        }
    }
}