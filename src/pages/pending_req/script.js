import firebase from 'firebase'
import func from '../../../custom_libs/func'

export default {
    created: function () {
        let self = this;
        $(function () {

        });

        const db = firebase.database();
        self.userRef = db.ref('/users');
        self.userReqRef = db.ref('/user_requests');
        self.activeReqRef = db.ref('/user_active_requests');

        self.activeReqRef.once('value').then(function (actSnap) {
            let actVal = actSnap.val();
            if(actVal !== null){
                let clientUIDKeys = Object.keys(actVal);
                let process_complete = 0;
                clientUIDKeys.forEach(function (uid) {
                    let pendRqData = actVal[uid];
                    self.userReqRef.child(uid+"/"+pendRqData.req_id).once('value').then(function (reqSnap) {
                        let reqData = reqSnap.val();
                        reqData['createdAt'] = func.set_date_ser(new Date(reqData.createdAt));
                        self.all.push(reqData);
                        process_complete++;
                        if(clientUIDKeys.length === process_complete){
                            self.dataLoad = false;
                        }
                    });
                });
            }else{
                self.dataLoad = false;
            }
        });
    },
    data: function(){
        return {
            dataLoad: true,
            all: [],
            userRef: null,
            userReqRef: null,
            activeReqRef: null
        }
    },
    methods: {

    }
}