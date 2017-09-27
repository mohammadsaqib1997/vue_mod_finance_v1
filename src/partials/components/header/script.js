import firebase from 'firebase'
export default {
    created: function(){
        let self = this;

        self.s_name = self.$root.loginUData.first_name+" "+self.$root.loginUData.last_name;
        self.imageLoad(self.$root.loginUData.uid);

        self.$watch(function () {
            return self.$root.loadImgSrc;
        }, function (val, oldVal) {
            if(val !== ""){
                self.pro_img_src = val;
            }
        });
        $("body").on('click', function(event){
            let clickedElement = $(event.target);
            let clickedDdTrigger = clickedElement.closest('.dd-trigger').length;
            let clickedDdContainer = clickedElement.closest('.dropdown-menu').length;
            if(self.opendd != null && clickedDdTrigger == 0 && clickedDdContainer == 0){
                self.hidedd(self.opendd);
            }
        });

        $("body").on('unload', function(e) {
            if(self.opendd != null){
                self.hidedd(self.opendd);
            }
        });
    },
    data: function(){
        return {
            loadImg: true,
            s_name: "",
            pro_img_src: "/assets/images/avatar-1.jpg",
            opendd: null,
        }
    },
    methods: {
        showNotifications: function($event){
            var targetdd = $($event.target).closest('.dropdown-container').find('.dropdown-menu');
            this.opendd = targetdd;
            if(targetdd.hasClass('fadeInDown')){
                this.hidedd(targetdd);
            }
            else{
                targetdd.css('display', 'block').removeClass('fadeOutUp').addClass('fadeInDown')
                    .on('animationend webkitAnimationEnd oanimationend MSAnimationEnd', function(){
                        $(this).show();
                    });
                targetdd.find('.dropdown-body')[0].scrollTop = 0;
                let awaitingNotifications = 0;
                $('#notifications-count').removeClass('fadeIn').addClass('fadeOut');
            }
        },
        hidedd: function(targetdd){
            targetdd.removeClass('fadeInDown').addClass('fadeOutUp').on('animationend webkitAnimationEnd oanimationend MSAnimationEnd');
            this.opendd = null;
            $('#notifications-count').removeClass('fadeOut').addClass('fadeIn');
        },
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