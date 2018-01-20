import _ from 'lodash'

export default {
    created: function () {
        let self = this;
    },
    data: function(){
        return {
            query: "",
            items: [],
            current: -1,
            urlProc_pi: null,
            urlProc_md: null,
            urlProc_v: null,

            // reference
            partyInformationRef: null,
        }
    },
    watch: {
        query: function (val) {
            if(val !== ""){
                this.loadData(val);
            }else{
                this.searchLoad([]);
            }
        }
    },
    methods: {
        validate: function(callback) {
            return this.$validate()
                .then(function(success) {
                    callback(success);
                });
        },
        reset_items: function () {
            this.items = [];
        },
        reset: function reset() {
            this.current = -1;
            this.items = [];
            this.query = '';
        },
        onHit (item) {
            this.reset();
            this.$router.push(item.url);
        },
        loadData: function (val) {
            let self = this;
            let grabData = [];
            self.current = -1;

            if(self.urlProc_pi !== null){
                clearTimeout(self.urlProc_pi);
            }
            self.urlProc_pi = setTimeout(function () {
                self.$http.get('/api/search_pi?search='+val).then(function (res) {
                    self.urlProc_pi = null;
                    let data = res.data.data;
                    if(data.length > 0){
                        data.forEach(function (obj) {
                            grabData.push({
                                text: obj.id+" | "+obj.agent_code+" | "+obj.agent_name,
                                url: "/search/vendor_detail/"+obj._id
                            });
                        });
                    }
                    self.searchLoad(grabData);
                });
            }, 500);

            if(self.urlProc_md !== null){
                clearTimeout(self.urlProc_md);
            }
            self.urlProc_md = setTimeout(function () {
                self.$http.get('/api/search_md?search='+val).then(function (res) {
                    self.urlProc_md = null;
                    let data = res.data.data;
                    if(data.length > 0){
                        data.forEach(function (obj) {
                            grabData.push({
                                text: obj.id+" | "+obj.allotee_code+" | "+obj.allotee_name,
                                url: "/search/master_detail/"+obj._id
                            });
                        });
                    }
                    self.searchLoad(grabData);
                });
            }, 500);

            if(self.urlProc_v !== null){
                clearTimeout(self.urlProc_v);
            }
            self.urlProc_v = setTimeout(function () {
                self.$http.get('/api/search_v?search='+val).then(function (res) {
                    self.urlProc_v = null;
                    let data = res.data.data;
                    if(data.length > 0){
                        data.forEach(function (obj) {
                            grabData.push({
                                text: obj.id+" | "+obj.v_remarks,
                                url: "/search/journal_voucher/"+obj._id
                            });
                        });
                    }
                    self.searchLoad(grabData);
                });
            }, 500);
        },
        searchLoad: function (data) {
            this.items = _.take(_.shuffle(data), 5);
            // console.log(this.searchData);
        },
        up: function up() {
            if (this.current > 0) {
                this.current--;
            } else if (this.current === -1) {
                this.current = this.items.length - 1;
            } else {
                this.current = -1;
            }
        },
        down: function down() {
            if (this.current < this.items.length - 1) {
                this.current++;
            } else {
                this.current = -1;
            }
        },
        hit: function hit() {
            if (this.current !== -1) {
                this.onHit(this.items[this.current]);
            }
        },
        activeClass: function activeClass(index) {
            return {
                active: this.current === index
            };
        },
        setActive: function setActive(index) {
            this.current = index;
        },
    }
}