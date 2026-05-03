const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const app = express();
const port = 6789;
// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));
// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.get('/', (req, res) => res.send('Hello World'));
// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
app.get('/chestionar', (req, res) => {
    const listaIntrebari = [
        {
            intrebare: 'Din ce material NU trebuie să fie vasul pus în cuptorul cu microunde?',
            variante: ['Sticlă', 'Plastic special pentru microunde', 'Metal / Aluminiu'],
            corect: 2
        },

        {
            intrebare: 'Ce se întâmplă dacă pui prea mult detergent în mașina de spălat rufe?',
            variante: ['Hainele se spală mai repede', 'Se formează spumă în exces care poate bloca pompa sau lăsa pete albe pe haine', 'Mașina consumă mai puțină apă'],
            corect: 1
        },

        {
            intrebare: 'Unde este cel mai rece loc într-un frigider obișnuit',
            variante: ['Pe raftul de jos, deasupra lăzii de legume', 'Pe raftul de sus', 'Pe ușa frigiderului'],
            corect: 0
        },

        {
            intrebare: 'Cum poți curăța eficient și natural interiorul unui cuptor cu microunde murdar?',
            variante: ['Răzuind pereții cu un burete de sârmă', 'Încălzind un bol cu apă și felii de lămâie până se creează abur', 'Lăsând ușa deschisă timp de 24 de ore'],
            corect: 1
        },

        {
            intrebare: 'Ce tip de vase sunt cele mai eficiente pentru un cuptor cu convecție (cu ventilator)?',
            variante: ['Vase cu pereți înalți, pentru a proteja mâncarea', 'Vase acoperite ermetic cu folie de aluminiu', 'Tăvi cu margini joase, pentru a permite aerului cald să circule peste mâncare'],
            corect: 2
        }

    ];
 // în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
    res.render('chestionar', {intrebari: listaIntrebari});
});
app.post('/rezultat-chestionar', (req, res) => {
    // req.body: { q0: '1', q1: '1', q2: '2' }
    let scor = 0;
    
    for (let i = 0; i < listaIntrebari.length; i++) {
        let raspunsUtilizator = parseInt(req.body['q' + i]); 
        
        if (raspunsUtilizator === listaIntrebari[i].corect) {
            scor++;
        }
    }

    res.render('rezultat-chestionar', { 
        scorAbtinut: scor, 
        totalIntrebari: listaIntrebari.length 
    });

    // console.log(req.body);
    // res.send("formular: " + JSON.stringify(req.body));
});
app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:${port}/`));