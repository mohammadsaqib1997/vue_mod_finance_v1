import firebase from 'firebase'

export default {
    created: function(){
        let self = this;
        self.$watch(function () {
            return self.$root.loginUData;
        }, function (val, oldVal) {
            if(val !== null){
                self.s_name = val.first_name+" "+val. last_name;
                self.imageLoad(val.uid);
            }
        });
        self.$watch(function () {
            return self.$root.loadImgSrc;
        }, function (val, oldVal) {
            if(val !== ""){
                self.pro_img_src = val;
            }
        });
    },
    data: function(){
        return {
            loadImg: true,
            s_name: "",
            pro_img_src: "/assets/images/avatar-1.jpg"
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
        },
        imageLoad: function (uid) {
            let self = this;
            const storage = firebase.storage();
            let ref = storage.ref('profile_images/' + uid + '.jpg');
            ref.getDownloadURL().then(function (url) {
                self.pro_img_src = url;
                self.loadImg = false;
            }, function (err) {
                self.pro_img_src = "/assets/images/avatar-1.jpg";
                self.loadImg = false;
            });
        }
    }
}