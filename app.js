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

const sqlite3 = require('sqlite3').verbose();

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
    
    let db = new sqlite3.Database('cumparaturi.db');

    db.all("SELECT * FROM produse", [], (err, rows) => {
        if (err) {
            return res.render('index', { produse: [] });
        }
        res.render('index', { produse: rows });
        db.close();
    });
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
});

app.get('/creare-bd', (req, res) => {
    let db = new sqlite3.Database('cumparaturi.db', (err) => {
        if (err) {
            console.error("Eroare la deschiderea bazei de date:", err.message);
            return res.status(500).send("Eroare server");
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS produse (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nume TEXT NOT NULL,
        firma TEXT NOT NULL,
        pret REAL NOT NULL
    )`, (err) => {
        if (err) {
            console.error("Eroare la crearea tabelei:", err.message);
        } else {
            console.log("Tabela 'produse' a fost creată/verificată.");
        }
        
        db.close();
        
        res.redirect('/');
    });
});

app.get('/incarcare-bd', (req, res) => {
    let db = new sqlite3.Database('cumparaturi.db', (err) => {
        if (err) {
            console.error("Eroare la deschiderea BD:", err.message);
            return res.status(500).send("Eroare server");
        }
    });

    const produseDeTest = [
        ['Frigider', 'Arctic', 1200.50],
        ['Mașină de spălat', 'Beko', 1500.00],
        ['Aspirator', 'Samsung', 449.99],
        ['Cuptor microunde', 'Gorenje', 320.00],
        ['Televizor LED Smart', 'LG', 2100.30]
    ];

    let sql = 'INSERT INTO produse (nume, firma, pret) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)';
    let params = produseDeTest.flat();

    db.run(sql, params, function(err) {
        if (err) {
            console.error("Eroare la inserarea datelor:", err.message);
        } else {
            console.log(`Au fost inserate ${this.changes} rânduri în tabela produse.`);
        }
        
        db.close();
        res.redirect('/');
    });
});


app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:${port}/`));