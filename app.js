const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const fs = require('fs'); // modulul pentru fisiere
const crypto = require('crypto'); //modulul nativ pentru criptografie
const app = express();
const port = 6789;

const cookieParser = require('cookie-parser');
app.use(cookieParser());


const session = require('express-session');
app.use(session({
    secret: 'amogus',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // schimbat in 'true' pe un server real cu HTTPS
        sameSite: 'lax' // ofera o protecție nativa la nivel de browser împotriva CSRF
    }
}));

const sqlite3 = require('sqlite3').verbose();

const { body, validationResult } = require('express-validator');



app.use((req, res, next) => {
    res.locals.utilizator = req.session.utilizator;

    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;
    
    next();
});//variabila utilizator devine disponibila global în toate fisierele EJS

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const bcrypt = require('bcrypt');
const saltRounds = 10; // complexitate criptografica

// async function inregistrareUtilizator(username, prenume, parolaSimpla) {
//     const hashParola = await bcrypt.hash(parolaSimpla, saltRounds);
    
//     console.log(`Parola originală: ${parolaSimpla}`);
//     console.log(`Parola salvată în BD: ${hashParola}`); 
// }

function verificaRol(rolPermis) {
    return (req, res, next) => {
        if (!req.session.utilizator) {
            return res.redirect('/autentificare');
        }
        
        if (req.session.utilizator.rol !== rolPermis) {
            return res.status(403).send("<div><h2>403 Forbidden: Nu aveți permisiunea de a accesa această pagină!</h2><a href='/'>Înapoi la pagina principală →</a></div>");
        }

        next();
    };
}

function verificaCSRF(req, res, next) {
    const tokenTrimis = req.body._csrf;

    if (!tokenTrimis || tokenTrimis !== req.session.csrfToken) {
        return res.status(403).send("<div'><h2>403 Forbidden: Atac CSRF detectat sau Token invalid!</h2><a href='/'>Înapoi la pagina principală →</a></div>");
    }
    next();
}

app.get('/', (req, res) => {
    if (!req.session.utilizator) {
        return res.render('index', { produse: [] });
    }
    
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

// parola => NO ESCAPE (pentru a nu strica caracterele speciale)                                   async pt bcrypt
app.post('/verificare-autentificare', [
    verificaCSRF,
    body('utilizator').trim().escape(), body('parola').trim()
], async(req, res) => {
    const erori = validationResult(req);
    if (!erori.isEmpty()) {
        res.cookie('mesajEroare', 'Datele introduse conțin caractere interzise.');
        return res.redirect('/autentificare');
    }

    const { utilizator, parola } = req.body;

    fs.readFile('utilizatori.json', 'utf8', async(err, data) => {
        if (err) {
            console.error("Eroare la citirea utilizatorilor:", err);
            return res.status(500).send("Eroare server");
        }

        const utilizatori = JSON.parse(data);

        const userGasit = utilizatori.find(u => u.utilizator === utilizator);
        if (userGasit) {
            const parolaCorecta = await bcrypt.compare(parola, userGasit.parola);

            if (parolaCorecta) {
                let profilUtilizator = { ...userGasit };
                delete profilUtilizator.parola;

                req.session.utilizator = profilUtilizator;
                res.clearCookie('mesajEroare');
                return res.redirect('/');
            }
        }

        res.cookie('mesajEroare', 'Utilizator sau parolă incorectă!');
        res.redirect('/autentificare');
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
        if (err) console.error("Eroare la crearea tabelei produse:", err.message);

        db.run(`CREATE TABLE IF NOT EXISTS cos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            id_produs INTEGER NOT NULL
        )`, (err) => {
            if (err) {
                console.error("Eroare la crearea tabelei cos:", err.message);
            } else {
                console.log("Tabelele 'produse' și 'cos' au fost verificate/create.");
            }
            db.close();
            res.redirect('/');
        });
    });
});

app.get('/incarcare-bd', (req, res) => {
    let db = new sqlite3.Database('cumparaturi.db', (err) => {
        if (err) {
            console.error("Eroare la deschiderea BD:", err.message);
            return res.status(500).send("Eroare server");
        }
    });

    db.get("SELECT COUNT(*) AS total FROM produse", [], (err, row) => {
        if (err) {
            console.error("Eroare la verificarea tabelei:", err.message);
            db.close();
            return res.redirect('/');
        }

        if (row.total > 0) {
            console.log("Produsele sunt deja afișate.");
            db.close();
            return res.redirect('/');
        }

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
});

app.post('/adauga-cos', [
    verificaCSRF,
    body('id_produs').trim().escape().isInt().toInt()
], (req, res) => {
    const erori = validationResult(req);
    if (!erori.isEmpty()) {
        return res.status(400).send("Cerere invalidă! ID-ul produsului este CoMpRoMiS.");
    }

    if (!req.session.utilizator) {
        return res.status(401).send("Trebuie să fii autentificat pentru a adăuga în coș!");
    }

    const idProdus = req.body.id_produs;
    const username = req.session.utilizator.utilizator;

    let db = new sqlite3.Database('cumparaturi.db');

    db.run("INSERT INTO cos (username, id_produs) VALUES (?, ?)", [username, idProdus], (err) => {
        if (err) {
            console.error("Eroare la adăugarea în BD a produsului:", err.message);
        }
        db.close();
        res.redirect('/');
    });
});

app.get('/vizualizare-cos', (req, res) => {
    if (!req.session.utilizator) {
        return res.redirect('/autentificare');
    }

    const username = req.session.utilizator.utilizator;
    let db = new sqlite3.Database('cumparaturi.db');

    const sql = `
        SELECT p.id, p.nume, p.firma, p.pret, COUNT(c.id_produs) AS cantitate
        FROM cos c
        JOIN produse p ON c.id_produs = p.id
        WHERE c.username = ?
        GROUP BY p.id
    `; // ? = > Prepared Statements (orice input este tratat strict ca un text sau numar)

    db.all(sql, [username], (err, rows) => {
        if (err) {
            console.error("Eroare la extragerea produselor din coș:", err.message);
            db.close();
            return res.render('vizualizare-cos', { produseCos: [], total: 0 });
        }

        const total = rows.reduce((sum, p) => sum + (p.pret * p.cantitate), 0);
        res.render('vizualizare-cos', { produseCos: rows, total: total });
        
        db.close();
    });
});

app.get('/admin', verificaRol('ADMIN'), (req, res) => {
    const mesajSucces = req.cookies.mesajSuccesAdmin;
    const mesajEroare = req.cookies.mesajEroareAdmin;

    res.clearCookie('mesajSuccesAdmin');
    res.clearCookie('mesajEroareAdmin');

    res.render('admin', { mesajSucces: mesajSucces, mesajEroare: mesajEroare });
});

app.post('/admin/adauga-produs', [
    verificaRol('ADMIN'),
    verificaCSRF,
    body('nume').trim().escape().notEmpty().withMessage('Numele produsului este obligatoriu.'),
    body('firma').trim().escape().notEmpty().withMessage('Firma este obligatorie.'),
    body('pret').trim().isFloat({ min: 0.01 }).withMessage('Prețul trebuie să fie un număr pozitiv, nenul.')
], (req, res) => {
    const erori = validationResult(req);
    
    if (!erori.isEmpty()) {
        res.cookie('mesajEroareAdmin', erori.array()[0].msg);
        return res.redirect('/admin');
    }

    const { nume, firma, pret } = req.body;
    let db = new sqlite3.Database('cumparaturi.db');

    const sql = "INSERT INTO produse (nume, firma, pret) VALUES (?, ?, ?)";
    
    db.run(sql, [nume, firma, parseFloat(pret)], function(err) {
        db.close();
        
        if (err) {
            console.error("Eroare la adăugarea produsului în BD:", err.message);
            return res.status(500).send("Eroare la salvarea în baza de date.");
            return res.redirect('/admin')
        }

        res.cookie('mesajSuccesAdmin', `Produsul "${nume}" a fost adăugat cu succes!`);
        res.redirect('/admin');
    });
});

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:${port}/`));