import 'jquery'
import pv from './private'

var qs = window.location.href.slice(window.location.href.indexOf('?')).replace(pv.QSToken, '');
var decrypted = CryptoJS.AES.decrypt(qs, pv.AESToken).toString(CryptoJS.enc.Utf8);

var token = decrypted.split(pv.spliter)[ 0 ];
var pageId = decrypted.split(pv.spliter)[ 1 ];
var unixTime = decrypted.split(pv.spliter)[ 2 ];

if (moment().unix() < parseInt(unixTime)) {

  window.superagent.get('https://api.bizsaya.com/contacts')
    .set('Authorization', token)
    .set(pv.customHeader, pageId)
    .end(function (err, response) {

      if (!err) {
        var sheetName = 'bizsaya'
        var prospek = []
        var datas = response.body.data ? response.body.data.contacts : []
        _.each(response.body.data.contacts, function (data) {
          if (data.payload) {
            prospek.push({
              nama: data.payload.sender_name,
              mesej: data.payload.message
            })
          }
        });

        if (datas.length !== 0) {
          var wb = new Workbook();
          var ws = XLSX.utils.json_to_sheet(prospek);
          wb.SheetNames.push(sheetName);
          wb.Sheets[ sheetName ] = ws;
          var wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'binary' });
          saveAs(new Blob([ s2ab(wbout) ], { type: "application/octet-stream" }), moment().format('DD_MM_YYYY') + "_bizsaya.xlsx");
          $('#message')
            .text('File telah dimuat turun. Sila semak folder download anda')
            .css('color', 'green');
          setTimeout(function () { window.close() }, 2000);
        } else {
          $('#message')
            .text('Ooopss. Tiada maklumat prospek bagi FB page ini dijumpai. Adakah anda telah aktifkan fungsi carian didalam modul komen dan inbox?')
            .css('color', 'red');
          setTimeout(function () { window.close() }, 4000);
        }

      } else {
        $('#message')
          .text('Ooppss.. Terdapat ralat sewaktu aplikasi Bizsaya mendapatkan senarai prospek bagi FB page ini. Sila cuba semula.')
          .css('color', 'red');
        setTimeout(function () { window.close() }, 4000);
      }

    })

} else {
  $('#message')
    .text('Oppss.. Kod pengesahan adalah tidak sah. Sila mulakan daripada aplikasi Bizsaya')
    .css('color', 'red');
  setTimeout(function () { window.close() }, 4000);
}

function Workbook () {
  if (!(this instanceof Workbook)) return new Workbook();
  this.SheetNames = [];
  this.Sheets = {};
}

function s2ab (s) {
  var buf = new ArrayBuffer(s.length);
  var view = new Uint8Array(buf);
  for (var i = 0; i != s.length; ++i) view[ i ] = s.charCodeAt(i) & 0xFF;
  return buf;
}