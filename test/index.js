'use strict'

/***
 * There is a company told i'm not a good developer because there is no testing script inside my playground code.
 * Well, say what ever you wanna to say. I know what im capable.
 * Just, remember not to judge the book by it's cover. Ask them, read a little bit about the chapter.
 * Then you can make the conclusion.
 *
 * Reminder for me also, Outside there have a good developer that sometime not good at first impression!
 *
 */

const assert = require('assert')
const expect = require('chai').expect

describe('Checking homepage', function () {

  it('Check title is correct', () => {

    const title = browser.url('/').getTitle()
    assert.equal(title, 'Bizsaya - Membantu automasi laman sosial Facebook Pages perniagaan anda')

  })

  it('Check bizsaya logo is there and correct URL', () => {

    const logo = $('.brand-name > img')
    expect(logo.value).not.to.be.a('null')
    assert.equal(logo.isVisible(), true)
    assert.equal(logo.getAttribute('src'), 'https://storage.googleapis.com/bizsaya_assets/bizsaya_logo_small.png')

  })

  it('Check bizsaya text is there', () => {

    const text = $('.brand-name > div')
    expect(text.value).not.to.be.a('null')
    assert.equal(text.isVisible(), true)
    assert.equal(text.getText(), 'Bizsaya')

  })

  it('Check button was there and pointing to correct URL', () => {

    const btn = $('.action-btn > a.btn')
    expect(btn.value).not.to.be.a('null')
    assert.equal(btn.isVisible(), true)
    assert.equal(btn.getAttribute('href'), 'https://api.bizsaya.com/auth/facebook')
    assert.equal(btn.getText(), 'Log masuk / Daftar')

  })

})