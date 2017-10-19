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
        self.regSubsidiaryRef = db.ref('/reg_subsidiary');
        self.vouchersEntriesRef = db.ref('/vouchers_entries');
        self.masterDetailsRef = db.ref('/master_details');
        self.vouchersRef = db.ref('/vouchers');
        self.brokersRef = db.ref('/brokers');
        self.projectTypesRef = db.ref('/project_types');
        self.projectTypeItemsRef = db.ref('/project_type_items');

        self.masterDetailsRef.child(params.mdId).once('value', function (mdSnap) {
            let mdData = mdSnap.val();
            if (mdData !== null) {
                self.projectRef.child(mdData.sel_project).once('value', function (projectSnap) {
                    let projectData = projectSnap.val();
                    mdData['sel_project'] = projectData.name;

                    self.brokersRef.child(mdData.sel_broker).once('value', function (brokerSnap) {
                        let brokerData = brokerSnap.val();
                        mdData['sel_broker'] = brokerData.name;

                        self.projectTypesRef.child(mdData.sel_type).once('value', function (proTypeSnap) {
                            let proTypeData = proTypeSnap.val();
                            mdData['sel_type'] = proTypeData.name;

                            self.projectTypeItemsRef.child(mdData.sel_pro_type_no).once('value', function (proTypeItemSnap) {
                                let proTypeItemData = proTypeItemSnap.val();
                                mdData['sel_pro_type_no'] = proTypeItemData.name;

                                self.regSubsidiaryRef.child(projectSnap.key).orderByChild("key").equalTo(proTypeItemData.subs_key).once('value', function (regSubsSnap) {
                                    let regSubsCode = Object.keys(regSubsSnap.val())[0];
                                    self.vouchersEntriesRef.orderByChild("v_key").equalTo(mdSnap.key).once('value', function (md_entSnap) {
                                        if (md_entSnap.numChildren() > 0) {
                                            let process_item = 0;
                                            let grabEnt = [];
                                            md_entSnap.forEach(function (entItemSnap) {
                                                let entItemData = entItemSnap.val();
                                                if (regSubsCode === entItemData.code) {
                                                    let date = moment(entItemData.v_date);
                                                    grabEnt.push({
                                                        type: "MD",
                                                        voucher_id: mdData.id,
                                                        installment: entItemData.credit,
                                                        amount: entItemData.credit,
                                                        penalty: false,
                                                        pay_date: date.format("DD/MM/YYYY"),
                                                        due_date: date.format("DD/MM/YYYY"),
                                                        due_date_unix: date.unix(),
                                                    });
                                                }

                                                process_item++;
                                                if (process_item === md_entSnap.numChildren()) {
                                                    let server_date_unix = moment().unix();
                                                    let booking_date = moment(mdData.booking_date);
                                                    for (let i = 0; i < mdData.payment_installment; i++) {
                                                        let dueDate = booking_date.add(1, "M");
                                                        let dataSet = {
                                                            type: "",
                                                            voucher_id: "",
                                                            installment: mdData.payment_plan,
                                                            amount: 0,
                                                            penalty: false,
                                                            pay_date: false,
                                                            due_date: dueDate.format("DD/MM/YYYY"),
                                                            due_date_unix: dueDate.unix(),
                                                        };
                                                        if (server_date_unix > dataSet.due_date_unix) {
                                                            dataSet['penalty'] = true;
                                                        }
                                                        grabEnt.push(dataSet);
                                                    }

                                                    self.vouchersRef.orderByChild("ref_key").equalTo(mdSnap.key).once('value', function (jv_entsSnap) {

                                                        if (jv_entsSnap.numChildren() > 0) {
                                                            let jv_entsData = jv_entsSnap.val();
                                                            let keys = Object.keys(jv_entsData);
                                                            keys.forEach(function (key, loopInd, arr) {
                                                                let jvEntData = jv_entsData[key];
                                                                if (jvEntData.posted_status === "Yes") {
                                                                    self.vouchersEntriesRef.orderByChild("v_key").equalTo(key).once('value', function (jvPayEntsSnap) {
                                                                        if (jvPayEntsSnap.numChildren() > 0) {
                                                                            jvPayEntsSnap.forEach(function (jvPayEntSnap) {
                                                                                let jvPayEntData = jvPayEntSnap.val();
                                                                                if (regSubsCode === jvPayEntData.code) {
                                                                                    let date = moment(jvPayEntData.v_date);
                                                                                    grabEnt.forEach(function (obj, ind, arr) {
                                                                                        if (obj.due_date_unix > date.unix()) {
                                                                                            if (arr[ind - 1].due_date_unix <= date.unix()) {
                                                                                                grabEnt[ind]['type'] = "JV";
                                                                                                grabEnt[ind]['voucher_id'] = jvEntData.id;
                                                                                                grabEnt[ind]['penalty'] = false;
                                                                                                grabEnt[ind]['pay_date'] = date.format("DD/MM/YYYY");
                                                                                                grabEnt[ind]['amount'] = jvPayEntData.credit;
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                }
                                                                            });
                                                                        }

                                                                        if (loopInd === arr.length - 1) {
                                                                            mdData['booking_date'] = moment(mdData.booking_date).format("DD/MM/YYYY");
                                                                            self.fetchData = self.reArrange({
                                                                                data: mdData,
                                                                                entData: grabEnt
                                                                            });
                                                                            self.dataLoad1 = false;
                                                                        }
                                                                    });
                                                                } else {
                                                                    if (loopInd === arr.length - 1) {
                                                                        mdData['booking_date'] = moment(mdData.booking_date).format("DD/MM/YYYY");
                                                                        self.fetchData = self.reArrange({
                                                                            data: mdData,
                                                                            entData: grabEnt
                                                                        });
                                                                        self.dataLoad1 = false;
                                                                    }
                                                                }
                                                            });
                                                        } else {
                                                            mdData['booking_date'] = moment(mdData.booking_date).format("DD/MM/YYYY");
                                                            self.fetchData = self.reArrange({
                                                                data: mdData,
                                                                entData: grabEnt
                                                            });
                                                            self.dataLoad1 = false;
                                                        }
                                                    });
                                                }
                                            });
                                        } else {
                                            self.dataLoad1 = false;
                                        }
                                    });
                                });
                            });
                        });
                    });
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
            dataLoad2: false,

            // data save
            proData: {},
            fetchData: {},
            optionalData: {
                title: 'Payment Plan',
                subTitle: '',
                date: moment().format('DD/MM/YYYY')
            },
            dLinks: {
                pdf: '/download/pdf/payment_plan',
                html: '/download/html/payment_plan',
                csv: null,
            },

            // references
            projectRef: null,
            regSubsidiaryRef: null,
            vouchersEntriesRef: null,
            masterDetailsRef: null,
            vouchersRef: null,
            brokersRef: null,
            projectTypesRef: null,
            projectTypeItemsRef: null,
        }
    },
    methods: {
        reArrange: function (obj) {
            let grabData = {};
            grabData['entData'] = [];
            grabData['data'] = obj.data;
            let totAmount = 0, totPenalty = 0, totInstallment = 0, totRemAmount = 0;
            let balance = obj.data.selling_price;
            let keys = Object.keys(obj.entData);
            keys.forEach(function (key) {
                let ent = obj.entData[key];

                totAmount += ent.amount;
                balance -= ent.amount;
                let penalty = (ent.penalty) ? (ent.installment*1)/100:0;
                totPenalty += penalty;
                balance += penalty;
                let remaining = ((ent.installment + penalty) - ent.amount);
                totInstallment += ent.installment;
                totRemAmount += remaining;

                ent['penalty'] = (penalty > 0) ? penalty:"";
                ent['remaining'] = remaining;
                ent['balance'] = balance;

                grabData['entData'].push(ent);
            });
            grabData['reqData'] = {
                totPenalty: totPenalty,
                totInstallment: totInstallment,
                totAmount: totAmount,
                totRemAmount: totRemAmount,
            };
            return grabData;
        }
    },
    components: {
        downloadSheetModel
    }
}