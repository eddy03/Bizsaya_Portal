'use strict'

import 'jquery'
// import 'popper.js'
import 'bootstrap'

import './scss/style.scss'
import 'animate.css'

import { init } from 'ityped'

$(document).ready(function () {

  init('#itype', {
    // required - for now, only accepting texts
    strings: [
      'Membantu automasi laman sosial Facebook Pages perniagaan anda',
      'Dilengkapi dengan modul Komen, Mesej dan Broadcast',
      'Menyimpan maklumat seperti nombor telefon atau emel sekiranya diberikan oleh prospek anda secara automatik',
      'Sangat mudah digunakan',
      'Minimal dan kemas',
      'Percuma trial selama 15 hari'
    ],
    //optional
    typeSpeed: 105, //default
    //optional
    backSpeed: 10, //default
    //optional
    startDelay: 500, //default
    //optional
    backDelay: 1500, //default
    //optional
    loop: true, //default
    //optional
    showCursor: true, //default
    //optional
    cursorChar: "|", //default
    // optional callback called once the last string has been typed
    onFinished: function(){}
  })

  $('.brand-name > img')
    .on('mouseleave', function () {
      $('.brand-name')
        .addClass('animated')
        .addClass('jello')
    })
    .on('mouseenter', function () {
      $('.brand-name')
        .removeClass('jello')
        .removeClass('animated')
    })

  var fbScriptLoaded = false
  var _screenHeight = $(window).height()
  var heightWithNav = _screenHeight + 60

  $(window).on('resize', function (e) {
    _screenHeight = $(window).height()
    heightWithNav = _screenHeight + 60
  })

  $(window).scroll(function(){
    var _cur_top = $(window).scrollTop();
    if(heightWithNav < _cur_top) {
      $('#bizsaya-nav')
        .addClass('fixed-top')
        .addClass('animated')
        .addClass('slideInDown')
      $('#nav-testimoni')
        .addClass('active')
      $('#nav-utama')
        .removeClass('active')
    } else {
      $('#bizsaya-nav')
        .removeClass('fixed-top')
        .removeClass('animated')
        .removeClass('slideInDown')
      $('#nav-testimoni')
        .removeClass('active')
      $('#nav-utama')
        .addClass('active')
    }

    if((_cur_top + _screenHeight) > ($(document).height() - 350) && fbScriptLoaded === false) {
      fbScriptLoaded = true;
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.10&appId=175920109485664";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    }
  })

  if(window.location.search === '?err=401') {
    $('#information-message')
      .removeClass('no-pd')
      .html('Akaun anda telah tamat tempoh aktif ataupun dibatalkan. Sila buat pembayaran terlebih dahulu atau menghubungi kami di whatsapp <a href="https://api.whatsapp.com/send?phone=60172631883">0172631883</a>')
  } else if(window.location.search === '?err=403') {
    $('#information-message')
      .removeClass('no-pd')
      .html('Sesi akaun telah tamat/tidak sah. Sila log masuk semula')
  } else {
    $('#information-message')
      .addClass('no-pd')
  }

})

$('#nav-utama').click(function (e) {
  $('html,body').animate({ scrollTop: 0 }, 'slow')
  e.preventDefault()
})
$('#nav-testimoni').click(function (e) {
  e.preventDefault()
})