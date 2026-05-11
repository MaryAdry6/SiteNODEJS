const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const fs = require('fs'); // modulul pentru fisiere
const app = express();
const port = 6789;

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/autentificare', (req, res) => {
    res.render('autentificare');
});

app.post('/verificare-autentificare', (req, res) => {
    console.log(req.body);
    
    res.send("Datele au fost primite. Verifică terminalul serverului tău!");
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