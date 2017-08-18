import firebase from 'firebase'
import func from '../../../custom_libs/func'

export default {
    created: function () {
        let self = this;
        $(function () {
            $("body").on('click', '.open_row', function(){
                let grabLink = $(this).attr("data-url");
                if(grabLink !== ""){
                    self.$router.push(grabLink);
                }
            });
        });

        const db = firebase.database();
        self.userRef = db.ref('/users');
        self.userRef.orderByChild('type').equalTo('driver').once('value').then(function(snap){
            self.dataLoad = false;
            let renderData = snap.val();
            let renderDataKeys = Object.keys(renderData);
            renderDataKeys.forEach(function(val){
                let item = renderData[val];
                if(item.status !== 0){
                    item['key'] = val;
                    item['time'] = func.set_date_ser(new Date(func.decode_key(val)));
                    self.data1.push(item);
                }
            });
        });
    },
    data: function(){
        return {
            dataLoad: true,
            data1: [],
            userRef: null
        }
    },
    methods: {
        deActive: function (key, index, event) {
            event.stopPropagation();
            let self = this;
            if(self.userRef){
                self.userRef.child(key).update({
                    status: 0
                }, function (err) {
                    if(err){
                        console.log(err)
                    }else{
                        self.data1.splice(index, 1);
                    }
                });
            }
        }
    }
}