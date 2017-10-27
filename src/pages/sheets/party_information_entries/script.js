import firebase from 'firebase'
import moment from 'moment'
import func from '../../../../custom_libs/func'

import downloadSheetModel from '../../../partials/components/modals/download_sheet/download_sheet.vue'

export default {
    created: function () {
        let self = this;
        let params = self.$route.params;

        const db = firebase.database();
        self.projectRef = db.ref('/projects');
        self.partyInformationRef = db.ref('/party_information');
        self.vouchersRef = db.ref('/vouchers');

        self.partyInformationRef.child(params.piId).once('value', function (snap) {
            let piData = snap.val();
            if(piData !== null){
                self.vouchersRef.orderByChild('ref_key').equalTo(snap.key).once('value', function (vSnap) {
                    let grabData = {};
                    if(vSnap.numChildren() > 0){
                        let process_item = 0;
                        vSnap.forEach(function (itemSnap) {
                            let item = itemSnap.val();
                            item['voucher_date'] = self.formatData(item.voucher_date);
                            item['posted_status'] = (item.posted_status !== "Yes") ? "Post": "UnPost";

                            self.projectRef.child(item.sel_project).once('value', function (proSnap) {
                                if(proSnap.val() !== null){
                                    item['sel_project'] = proSnap.val().name;
                                }
                                grabData[itemSnap.key] = item;
                                process_item++;
                                if(process_item === vSnap.numChildren()){
                                    piData['key'] = snap.key;
                                    self.fetchData['data'] = piData;
                                    self.fetchData['entData'] = grabData;
                                    self.dataLoad1 = false;
                                }
                            });
                        });
                    }else{
                        piData['key'] = snap.key;
                        self.fetchData['data'] = piData;
                        self.fetchData['entData'] = grabData;
                        self.dataLoad1 = false;
                    }
                });
            } else {
                self.$router.push('/');
            }
        });

    },
    data: function () {
        return {
            dbLoad: null,

            //loaders
            dataLoad1: true,

            // data save
            proData: {},
            fetchData: {},
            optionalData: {
                title: 'Vendor Entries',
                subTitle: '',
                date: moment().format('DD/MM/YYYY')
            },
            dLinks: {
                pdf: '/download/pdf/vendor_entries',
                html: '/download/html/vendor_entries',
                csv: null,
            },

            // references
            projectRef: null,
            vouchersRef: null,
            partyInformationRef: null,
        }
    },
    methods: {
        formatData: function (dateM) {
            return moment(dateM).format("DD/MM/YYYY");
        }
    },
    components: {
        downloadSheetModel
    }
}