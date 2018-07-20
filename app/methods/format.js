module.exports = {
  date: (date, format) => {
    let d = date.getDate();
    let m = date.getMonth() + 1;
    let y = date.getFullYear();

    let h = date.getHours();

    let hf = (h > 11) ? 'PM' : 'AM';
    let hh = (h > 12) ? h % 12 : h;
    let mm = date.getMinutes();
    let ss = date.getSeconds();

    if (d < 10) d = '0' + d;
    if (m < 10) m = '0' + m;
    if (hh < 10) hh = '0' + hh;
    if (mm < 10) mm = '0' + mm;
    if (ss < 10) ss = '0' + ss;

    return {
      date: format === 'mm-dd-yyyy' ? m + '-' + d + '-' + y :
        format === 'yyyy-mm-dd' ? y + '-' + m + '-' + d :
          d + '-' + m + '-' + y,
      time: hh + ':' + mm + ':' + ss + ' ' + hf
    };
  }
}