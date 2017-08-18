module.exports  = {
    decode_key: function (id) {
        var PUSH_CHARS= "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
        id = id.substring(0,8);
        var timestamp = 0;
        for (var i=0; i < id.length; i++) {
            var c = id.charAt(i);
            timestamp = timestamp * 64 + PUSH_CHARS.indexOf(c);
        }
        return timestamp;
    },
    set_date_ser: function (date) {
        var h_obj = this.get_12_hours(date.getHours());
        return h_obj.hour+":"+("0"+date.getMinutes()).slice(-2)+" "+h_obj.ap+" "+date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear();
    },
    get_12_hours: function(hours){
        var ap = ['AM', 'PM'];
        return { hour: ("0" + (hours % 12)).slice(-2), ap: ap[Math.floor(hours/12)] }
    },
    sortObj: function sortObject(o) {
        var sorted = {},
            key, a = Object.keys(o);
        a.sort().reverse();
        for (key = 0; key < a.length; key++) {
            sorted[a[key]] = o[a[key]];
        }
        return sorted;
    },
    genInvoiceNo: function (num) {
        num = num.toString();
        if(num.length < 3){
            num = ('00'+num).slice(-3);
        }
        return num;
    }
};