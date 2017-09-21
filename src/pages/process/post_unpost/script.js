import firebase from 'firebase'
import func from '../../../../custom_libs/func'

export default {
    created: function () {
        let self = this;

        const db = firebase.database();
        self.projectsRef = db.ref('/projects');
        self.masterDetailsRef = db.ref('/master_details');
        self.partyInformationRef = db.ref('/party_information');
        self.vouchersRef = db.ref('/vouchers');
        self.projectTypeItemsRef = db.ref('/project_type_items');
        self.vouchersEntriesRef = db.ref('/vouchers_entries');

        self.vouchersRef.once('value', function (snap) {
            if (snap.numChildren() > 0) {
                let process_item = 0;
                snap.forEach(function (voucher) {
                    let item = voucher.val();
                    self.projectsRef.child(item.sel_project).once("value", function (proSnap) {
                        let proData = proSnap.val();
                        item['project'] = proData.name;

                        item['type'] = "jv";
                        if(item.ref_key !== ""){
                            if(item.ref_type === "pi"){
                                self.partyInformationRef.child(item.ref_key).once('value', function (piSnap) {
                                    let piData = piSnap.val();

                                    item['ref_gen'] = piData.id+" | "+piData.contact_name+" | "+piData.agent_name+" (Vendor Detail)";
                                    self.vouchersData[voucher.key] = item;
                                    process_item++;
                                    if(process_item === snap.numChildren()){
                                        self.vouchersData = func.sortObj(self.vouchersData, false);
                                        self.loadMasterDetails(self, function () {
                                            self.dataLoad1 = false;
                                        });
                                    }
                                });
                            }else if(item.ref_type === "md"){
                                self.masterDetailsRef.child(item.ref_key).once('value', function (mdSnap) {
                                    let mdData = mdSnap.val();
                                    item['ref_gen'] = mdData.id+" | "+mdData.allotee_name+" (Customer Detail)";

                                    self.vouchersData[voucher.key] = item;
                                    process_item++;
                                    if(process_item === snap.numChildren()){
                                        self.vouchersData = func.sortObj(self.vouchersData, false);
                                        self.loadMasterDetails(self, function () {
                                            self.dataLoad1 = false;
                                        });
                                    }
                                });
                            }
                        }else{
                            self.vouchersData[voucher.key] = item;
                            process_item++;
                            if(process_item === snap.numChildren()){
                                self.vouchersData = func.sortObj(self.vouchersData, false);
                                self.loadMasterDetails(self, function () {
                                    self.dataLoad1 = false;
                                });
                            }
                        }
                    });
                });
            } else {
                self.loadMasterDetails(self, function () {
                    self.dataLoad1 = false;
                });
            }
        });
    },
    data: function(){
        return {
            //loaders
            dataLoad1: true,

            //data
            vouchersData: {},

            //references
            projectsRef: null,
            masterDetailsRef: null,
            partyInformationRef: null,
            vouchersRef: null,
            projectTypeItemsRef: null,
            vouchersEntriesRef: null,
        }
    },
    methods: {
        formatDate: function (date) {
            return func.getDate(date);
        },
        active: function (key) {
            let self = this;
            let sel_item = self.vouchersData[key];
            if(sel_item.type === "md"){
                self.masterDetailsRef.child(key).update({
                    posted_status: "Yes"
                }, function(err){
                    if(err){
                        console.log(err);
                    }
                    self.vouchersData[key]['posted_status'] = "Yes";
                });
            }else{
                self.vouchersRef.child(key).update({
                    posted_status: "Yes"
                }, function(err){
                    if(err){
                        console.log(err);
                    }
                    self.vouchersData[key]['posted_status'] = "Yes";
                });
            }
        },
        deactive: function (key) {
            let self = this;
            let sel_item = self.vouchersData[key];
            if(sel_item.type === "md"){
                self.masterDetailsRef.child(key).update({
                    posted_status: "No"
                }, function(err){
                    if(err){
                        console.log(err);
                    }
                    self.vouchersData[key]['posted_status'] = "No";
                });
            }else{
                self.vouchersRef.child(key).update({
                    posted_status: "No"
                }, function(err){
                    if(err){
                        console.log(err);
                    }
                    self.vouchersData[key]['posted_status'] = "No";
                });
            }
        },
        loadMasterDetails: function (self, callback) {
            self.masterDetailsRef.once('value', function (snap) {
                if (snap.numChildren() > 0) {
                    let process_item = 0;
                    snap.forEach(function (mdSnap) {
                        let item = mdSnap.val();
                        self.projectsRef.child(item.sel_project).once("value", function (proSnap) {
                            let proData = proSnap.val();
                            item['project'] = proData.name;
                            item['type'] = "md";

                            self.projectTypeItemsRef.child(item.sel_pro_type_no).once('value', function (proSelItemSnap) {
                                let data = proSelItemSnap.val();

                                item['ref_gen'] = item.allotee_code+" | "+ item.allotee_name +" | "+data.name;
                                process_item++;
                                self.vouchersData[mdSnap.key] = item;
                                if(process_item === snap.numChildren()){
                                    self.vouchersData = func.sortObj(self.vouchersData);
                                    callback();
                                }
                            });
                        });
                    });
                } else {
                    callback();
                }
            });
        }
    }
}