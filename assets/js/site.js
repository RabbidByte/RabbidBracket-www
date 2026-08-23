/* RabbidBracket marketing site — mobile nav + contact form.
   Vanilla, no dependencies, safe to serve straight from S3. */
(function () {
  'use strict'

  /* ── Config ──────────────────────────────────────────────────────────────
     CONTACT_ENDPOINT: a URL that accepts a POST of the form fields (an API
     Gateway → Lambda/SES endpoint, or a form service). Leave it empty and the
     form falls back to opening the visitor's mail client with everything
     pre-filled, so the page works on day one with no backend. */
  var CONTACT_ENDPOINT = ''
  var CONTACT_EMAIL = 'hello@rabbidbracket.com'

  /* ── Mobile nav ── */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle')
    var nav = document.getElementById('site-nav')
    if (!toggle || !nav) return

    function setOpen(open) {
      nav.setAttribute('data-open', open ? 'true' : 'false')
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true')
    })

    // Tapping a link closes the drawer; so does Escape.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false)
    })

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false)
        toggle.focus()
      }
    })

    // Leaving the mobile breakpoint must not strand the drawer half-open.
    var mq = window.matchMedia('(min-width: 821px)')
    var onChange = function (e) {
      if (e.matches) setOpen(false)
    }
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else if (mq.addListener) mq.addListener(onChange)
  }

  /* ── Contact form ── */
  function initContactForm() {
    var form = document.getElementById('contact-form')
    if (!form) return

    var status = document.getElementById('form-status')
    var submit = form.querySelector('button[type="submit"]')

    function say(state, msg) {
      if (!status) return
      status.setAttribute('data-state', state)
      status.textContent = msg
    }

    function fields() {
      var data = {}
      new FormData(form).forEach(function (value, key) {
        data[key] = typeof value === 'string' ? value.trim() : value
      })
      return data
    }

    function mailtoFallback(data) {
      var subject = '[RabbidBracket] ' + (data.topic || 'Website enquiry')
      var body = [
        'Name: ' + (data.name || ''),
        'Email: ' + (data.email || ''),
        'Venue / organization: ' + (data.venue || '—'),
        'Topic: ' + (data.topic || '—'),
        '',
        data.message || '',
      ].join('\n')
      window.location.href =
        'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body)
      say('info', 'Opening your email app with the message ready to send. If nothing happens, email ' + CONTACT_EMAIL + ' directly.')
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault()

      var data = fields()
      if (data.website) return // honeypot tripped — silently ignore the bot
      if (!form.reportValidity()) return

      if (!CONTACT_ENDPOINT) {
        mailtoFallback(data)
        return
      }

      submit.disabled = true
      say('info', 'Sending…')

      fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status)
          form.reset()
          say('ok', 'Thanks — your message is on its way. We usually reply within a couple of days.')
        })
        .catch(function () {
          say('error', 'That did not go through. Please email ' + CONTACT_EMAIL + ' instead.')
        })
        .then(function () {
          submit.disabled = false
        })
    })
  }

  /* ── Footer year ── */
  function initYear() {
    var el = document.getElementById('year')
    if (el) el.textContent = String(new Date().getFullYear())
  }

  function init() {
    initNav()
    initContactForm()
    initYear()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
