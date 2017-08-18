import firebase from 'firebase'
import func from '../../../custom_libs/func'

export default {
    created: function () {
        let self = this;
        $(function () {
            $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyCeDfncmN-9FXb-1Gv4wcRpDWZ4AUnrqws")
                .done(function (script, textStatus) {
                    let mapOptions = {
                        center: new google.maps.LatLng(30.375321, 69.345116),
                        zoom: 5
                    };
                    let map = new google.maps.Map(document.getElementById('map'), mapOptions);
                })
                .fail(function (jqxhr, settings, exception) {
                    console.log("Triggered ajaxError handler.");
                });
        });

        const db = firebase.database();
        self.userRef = db.ref('/users');
        self.userReqRef = db.ref('/user_requests');
        self.liveReqRef = db.ref('/user_live_requests');

        self.liveReqRef.once('value').then(function (liveSnap) {
            let liveVal = liveSnap.val();
            if (liveVal !== null) {
                let clientUIDKeys = Object.keys(liveVal);
                let process_complete = 0;
                clientUIDKeys.forEach(function (uid) {
                    let liveRqData = liveVal[uid];
                    self.userReqRef.child(uid + "/" + liveRqData.reqId).once('value').then(function (reqSnap) {
                        let reqData = reqSnap.val();
                        reqData['createdAt'] = func.set_date_ser(new Date(reqData.createdAt));
                        self.all[reqSnap.key] = reqData;
                        process_complete++;
                        if (clientUIDKeys.length === process_complete) {
                            self.all = func.sortObj(self.all);
                            self.dataLoad = false;
                        }
                    });
                });
            } else {
                self.dataLoad = false;
            }
        });
    },
    data: function () {
        return {
            dataLoad: true,
            all: {},
            userRef: null,
            userReqRef: null,
            liveReqRef: null
        }
    },
    methods: {}
}