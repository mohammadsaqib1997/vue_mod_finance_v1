import firebase from 'firebase'
import moment from 'moment'
export default {
    created: function () {
        let self = this;

        self.s_name = self.$root.loginUData.first_name + " " + self.$root.loginUData.last_name;
        self.imageLoad(self.$root.loginUData.uid);

        self.$watch(function () {
            return self.$root.loadImgSrc;
        }, function (val, oldVal) {
            if (val !== "") {
                self.pro_img_src = val;
            }
        });

        const db = firebase.database();
        self.masterDetailsData = db.ref('/master_details');
        self.vouchersRef = db.ref('/vouchers');

        self.masterDetailsData.once('value', function (mdSnap) {
            let mdData = mdSnap.val();
            let keys = Object.keys(mdData);
            let cur_date = moment();
            let prev_m = cur_date.clone().subtract(1, 'M').set('date', 1);
            let next_m = cur_date.clone().add(1, 'M').set('date', 1);
            let notify_date = next_m.clone().subtract(7, 'days');
            // console.log("Prev: " + prev_m.format('DD/MM/YYYY') + " Curr: " + cur_date.format('DD/MM/YYYY') + " Next: " + next_m.format('DD/MM/YYYY'));
            console.log(notify_date.format('DD/MM/YYYY'));
            keys.forEach(function (key, ind, arr) {
                let item = mdData[key];
                let booking_date = moment(item.booking_date).format('DD/MM/YYYY');


                if (ind === arr.length - 1) {
                    self.countNotif = keys.length;
                    self.loadNoti = false;
                }
                /*self.vouchersRef.orderByChild('ref_key').equalTo(key).once('value', function (vSnap) {
                 let vData = vSnap.val();
                 console.log(vData);
                 if(ind === arr.length-1){
                 self.loadNoti = false;
                 }
                 });*/
            });
        });

    },
    mounted: function () {
        let self = this;
        $("body").on('click', function (event) {
            let clickedElement = $(event.target);
            let clickedDdTrigger = clickedElement.closest('.dd-trigger').length;
            let clickedDdContainer = clickedElement.closest('.dropdown-menu').length;
            if (self.opendd !== null && clickedDdTrigger === 0 && clickedDdContainer === 0) {
                self.hideNot(self.opendd);
            }
        });
    },
    data: function () {
        return {
            countNotif: 0,
            loadNoti: true,
            masterDetailsRef: null,
            vouchersRef: null,
            loadImg: true,
            s_name: "",
            pro_img_src: "/assets/images/avatar-1.jpg",
            opendd: null,
        }
    },
    methods: {
        showNotifications: function (event) {
            let targetdd = $(event.target).closest('.dropdown-container').find('.dropdown-menu');
            if (this.opendd !== null) {
                if (this.opendd[0] === targetdd[0]) {
                    this.hideNot(this.opendd);
                } else {
                    this.hideNot(this.opendd);
                    this.openNot(targetdd);
                }
            } else {
                this.openNot(targetdd);
            }
        },
        openNot: function (targetdd) {
            this.opendd = targetdd;
            targetdd.css('display', 'block').removeClass('fadeOutUp').addClass('fadeInDown')
                .on('animationend webkitAnimationEnd oanimationend MSAnimationEnd', function () {
                    $(this).css('display', 'block');
                });
            targetdd.find('.dropdown-body')[0].scrollTop = 0;
        },
        hideNot: function (targetdd) {
            this.opendd = null;
            targetdd.removeClass('fadeInDown').addClass('fadeOutUp')
                .on('animationend webkitAnimationEnd oanimationend MSAnimationEnd', function () {
                    $(this).css('display', 'none');
                });

            //$('#notifications-count').removeClass('fadeOut').addClass('fadeIn');
        },
        logout: function () {
            firebase.auth().signOut().then(function () {
                $("#app").removeAttr("class");
            }, function (err) {
                if (err) {
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