export default {
    props: ['fetchData' , 'optionalData'],
    created: function () {
        let self = this;


    },
    data: function () {
        return {
            pdfLoader: false,
            pdfDownload: null,
            pdfFile: '',
            pdfCounter: 5,
        }
    },
    watch: {
        pdfDownload: function (val) {
            let self  = this;
            if(val !== null){
                let interval = setInterval(function () {
                    self.pdfCounter--;
                    if(self.pdfCounter === 0){
                       clearInterval(interval);
                       let anch = document.getElementById('pdfDownload');
                       anch.click();
                    }
                }, 1000);
            }
        }
    },
    methods: {
        pdf: function () {
            let self = this;
            self.pdfLoader= true;
            self.$http.post('/download/pdf/listing/control', {
                fetchData: self.fetchData,
                optionalData: self.optionalData,
            }).then(function (res) {
                if(res.body.status === "ok"){
                    self.pdfDownload = res.body.link;
                    self.pdfFile = res.body.name;
                }else{
                    console.log(res.body.message);
                }
                self.pdfLoader= false;
            }, function (err) {
                console.log(err);
                self.pdfLoader= false;
            });
        }
    }
}