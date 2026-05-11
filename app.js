const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const fs = require('fs'); // modulul pentru fisiere
const app = express();
const port = 6789;

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const session = require('express-session');
app.use(session({
    secret: 'amogus',
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.utilizator = req.session.utilizator;
    next();
});//variabila utilizator devine disponibila global în toate fisierele EJS

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    // const utilizatorLogat = req.cookies.utilizator;
    // res.render('index', { utilizator: utilizatorLogat });

    res.render('index');
});

app.get('/autentificare', (req, res) => {
    const mesajEroare = req.cookies.mesajEroare;
    res.render('autentificare', { mesajEroare: mesajEroare });
});

app.post('/verificare-autentificare', (req, res) => {
    const { utilizator, parola } = req.body;

    fs.readFile('utilizatori.json', 'utf8', (err, data) => {
        if (err) {
            console.error("Eroare la citirea utilizatorilor:", err);
            return res.status(500).send("Eroare server");
        }

        const utilizatori = JSON.parse(data);
        const userGasit = utilizatori.find(u => u.utilizator === utilizator && u.parola === parola);

        if (userGasit) {
            let profilUtilizator = { ...userGasit };
            delete profilUtilizator.parola;

            req.session.utilizator = profilUtilizator;
            
            res.clearCookie('mesajEroare');
            res.redirect('/');
        } else {
            res.cookie('mesajEroare', 'Utilizator sau parolă incorectă!');
            res.redirect('/autentificare');
        }
    });
});

app.get('/deconectare', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/chestionar', (req, res) => {
    fs.readFile('intrebari.json', 'utf8', (err, data) => {
        if (err) {
            console.error("Eroare la citirea fișierului:", err);
            return res.status(500).send("Eroare server");
        }
        const intrebari = JSON.parse(data);
        res.render('chestionar', { intrebari: intrebari });
    });
});

app.post('/rezultat-chestionar', (req, res) => {
    fs.readFile('intrebari.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send("Eroare server");
        }

        const intrebari = JSON.parse(data);
        let scor = 0;

        for (let i = 0; i < intrebari.length; i++) {
            let raspunsUtilizator = parseInt(req.body['q' + i]);
            if (raspunsUtilizator === intrebari[i].corect) {
                scor++;
            }
        }

        res.render('rezultat-chestionar', { 
            scorObtinut: scor, 
            totalIntrebari: intrebari.length 
        });
    });

    // console.log(req.body);
    // res.send("formular: " + JSON.stringify(req.body));
});
app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:${port}/`));