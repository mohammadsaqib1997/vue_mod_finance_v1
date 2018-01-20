export default {
    watch: {
        query: function (val) {
            if(val !== ""){
                if(!this.bot) {
                    this.loadData(val);
                }
            }else{
                this.searchLoad([]);
            }
            this.bot = false;
        },
        project: function (val) {
            this.$emit('name_change', {code: "", name: ""});
            this.reset();
        },
        name: function (val) {
            this.bot = true;
            this.query = this.selected = val;
        }
    },
    props: ['project', 'name'],
    data: function(){
        return {
            hasFocus: false,
            bot: false,
            selected: this.name,
            query: this.name,
            items: [],
            current: -1,
            urlProc_subs: null
        }
    },
    methods: {
        loadData: function (input) {
            let self = this;
            if(self.urlProc_subs !== null){
                clearTimeout(self.urlProc_subs);
            }
            self.urlProc_subs = setTimeout(function () {
                self.$http.get('/api/get_subs_name?project='+self.project+'&input='+input).then(function (res) {
                    self.urlProc_subs = null;
                    self.searchLoad(res.data.data);
                });
            }, 500);
        },
        searchLoad: function (data) {
            this.items = data;
        },
        checkPro: function (e) {
            let self = this;
            self.hasFocus = true;
            if(self.project === ""){
                e.preventDefault();
                alert("Please Select Project!");
            }else{
                if(e.keyCode === 120){
                    e.preventDefault();
                    self.$emit("list_subs_pro_id");
                }
            }
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
        onHit (item) {
            if(item){
                this.$emit('name_change', item);
                this.bot = true;
                this.query = this.selected = item.name;
                this.reset_items();
            }
        },
        hit: function () {
            if (this.current !== -1) {
                this.onHit(this.items[this.current]);
            }
        },
        reset_items: function () {
            this.current = -1;
            this.items = [];
        },
        reset: function () {
            this.current = -1;
            this.items = [];
            this.query = this.selected = '';
        },
        blur_reset: function () {
            this.bot = true;
            this.hasFocus = false;
            if(this.query !== ""){
                this.query = this.selected;
                this.reset_items();
            }else{
                this.$emit('name_change', {code: "", name: ""});
                this.query = this.selected = "";
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