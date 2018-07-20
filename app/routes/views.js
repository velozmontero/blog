const format = require('../methods/format');

module.exports = function (app, isLoggedIn) {

  app.get('/', function (req, res) {
    if (req.isAuthenticated()) {
      res.redirect('/home');
    }
    else {
      res.redirect('/sign-in');
    }

    // var v = {
    //   fname: 'Pepe',
    //   lname: 'Billete'
    // };

    // var s = `
    //   <div>
    //     <h2> {{ fname }} {{ lname }} Techlaunching in </h2>
    //     <%= function(){
    //       var s =''; 
    //       for(var i = 10; i--;){
    //         s+='<div>'+i+'</div>';
    //       }; 
    //       return s;
    //     } %>
    //   </div>
    // `;

    // function interprate(s) {
    //   let operations = s.replace(/\n|\r|\s{2,}/g, ' ')
    //     .replace(/\{\{(\s*\w+\s*)\}\}/g, (m, c) => v[c.trim()])
    //     .replace(/<%=(.*)%>/g, (m, f) => eval("(" + f + ")")());

    //   console.log('operations ', operations);

    //   return operations;
    // }

    // res.send(interprate(s));
  });

  app.get('/home', isLoggedIn, function (req, res) {
    res.render('home', {
      user: req.user
    });
  });

  app.get('/password-recovery', function (req, res) {
    res.render('password_recovery', {
      message: req.flash('password-recovery-msg'),
    });
  });

  app.get('/password-reset', function (req, res) {
    res.render('password_reset', {
      message: req.flash('password-reset-msg'),
    });
  });

  app.get('/profile', isLoggedIn, function (req, res) {
    res.render('profile', {
      user: req.user
    });
  });

  app.get('/sign-in', function (req, res) {
    if(req.isAuthenticated()) {
      res.redirect('/home');
    }
    else {
      res.render('signin', {
        message: req.flash('sign-in-msg'),
      });
    }
  });

  app.get('/sign-up', function (req, res) {
    if (req.isAuthenticated()) {
      res.redirect('/home');
    }
    else {
      res.render('signup', {
        message: req.flash('sign-up-msg')
      });
    }
  });

  app.get('/update-profile', isLoggedIn, function (req, res) {
    res.render('update_profile', {
      message: req.flash('update-profile-msg'),
      user: {
        ...req.user,
        birthday: format.date(new Date(req.user.birthday), 'yyyy-mm-dd').date
      },
    });
  });

  app.get('*', function (req, res) {
    res.render('404');
  });
}