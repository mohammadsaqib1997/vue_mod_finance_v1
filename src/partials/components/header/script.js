import firebase from 'firebase'

export default {
    data: function(){
        return {

        }
    },
    methods: {
        logout: function () {
            firebase.auth().signOut().then(function () {
                $("#app").removeAttr("class");
            },function (err) {
                if(err){
                    console.log(err);
                }
            });
        }
    }
}